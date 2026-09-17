# frozen_string_literal: true

module ApplicationHelper
  # Flash keys that signal other UI rather than carrying a message to display.
  NON_MESSAGE_FLASH_KEYS = %i[conflict_submitted undo_payment_id].freeze

  def flash_message?(type, message)
    !NON_MESSAGE_FLASH_KEYS.include?(type.to_sym) && message.present?
  end

  def flash_color(type)
    case type.to_sym
    when :alert, :error
      'flash-error'
    when :success
      'flash-success'
    when :info
      'flash-info'
    else
      'flash-default'
    end
  end

  # One nav list per role, rendered two ways (sidebar + mobile drawer).
  NavItem = Struct.new(:label, :path, :icon, :badge, :match, :exact, keyword_init: true)

  def shell_nav_for(role)
    case role
    when 'admin'       then admin_nav
    when 'coordinator' then coordinator_nav
    when 'staff'       then staff_nav
    when 'member'      then member_nav
    else []
    end
  end

  def shell_utility_nav
    [
      NavItem.new(label: 'Whistleblower', path: whistleblowers_path, icon: :flag),
      NavItem.new(label: 'Settings',      path: settings_path,       icon: :cog)
    ]
  end

  # Active is a path prefix, and the deepest match wins, so a nested route
  # lights up its own item rather than an ancestor's. Resolved once against the
  # whole nav set: which item wins is a property of the set, not of one row, and
  # asking an item in isolation is what left a nested route highlighting nothing.
  #
  # Two opt-outs. `exact: true` is for the role home items — /admin is a prefix
  # of every admin route, so it would otherwise never turn off. `match:` is for
  # the items whose section isn't a path prefix of their own link
  # (/admin/payments doesn't contain /admin/payment_schedules).
  def active_nav?(item)
    active_nav_item.present? && active_nav_item == item
  end

  def active_nav_item
    return @active_nav_item if defined?(@active_nav_item)

    items = shell_nav_for(current_user_role) + shell_utility_nav

    @active_nav_item = matched_nav_item(items) ||
                       exact_nav_item(items) ||
                       deepest_nav_item(items)
  end

  def matched_nav_item(items)
    items.find { |item| item.match && request.path.match?(item.match) }
  end

  def exact_nav_item(items)
    items.find { |item| item.exact && current_page?(item.path) }
  end

  def deepest_nav_item(items)
    items.reject { |item| item.match || item.exact }
         .select { |item| path_within?(item.path) }
         .max_by { |item| item.path.length }
  end

  def path_within?(item_path)
    return false if item_path.blank?

    request.path == item_path || request.path.start_with?("#{item_path}/")
  end

  def user_initials(user)
    initials = "#{user.try(:first_name).to_s[0]}#{user.try(:last_name).to_s[0]}".upcase
    initials.presence || user.username.to_s[0, 2].upcase
  end

  private

  # How many conflicts are waiting on a decision, for the nav badge. One
  # indexed COUNT, memoized per request, and nil at zero so a clear queue
  # carries no badge at all rather than a "0".
  def pending_conflict_badge
    return @pending_conflict_badge if defined?(@pending_conflict_badge)

    @pending_conflict_badge = begin
      season = current_season
      if season.nil?
        nil
      else
        count = Conflict.for_season(season['id'])
                        .future_conflicts
                        .joins(:conflict_status)
                        .where(conflict_statuses: { name: 'Pending' })
                        .count
        count.positive? ? count : nil
      end
    end
  end

  # Inventory is a grant, not a role: InventoryController admits any
  # quartermaster whatever their season role, so the link has to follow the
  # same condition or a staff quartermaster has to be sent the URL.
  def inventory_nav_items
    return [] unless current_user&.quartermaster?

    [NavItem.new(label: 'Inventory', path: inventory_categories_path, icon: :cube)]
  end

  def admin_nav
    [
      NavItem.new(label: 'Home',      path: admin_home_path,            icon: :home, exact: true),
      NavItem.new(label: 'Users',     path: admin_users_path,           icon: :users),
      NavItem.new(label: 'Payments',  path: admin_payments_path,        icon: :cash,
                  match: %r{\A/admin/payment}),
      NavItem.new(label: 'Conflicts', path: admin_conflicts_path,       icon: :calendar,
                  badge: pending_conflict_badge),
      NavItem.new(label: 'Files',     path: files_path,                 icon: :folder),
      NavItem.new(label: 'Inventory', path: inventory_categories_path,  icon: :cube),
      NavItem.new(label: 'Emails',    path: inventory_email_rules_path, icon: :mail),
      NavItem.new(label: 'Calendars', path: admin_calendars_path,       icon: :calendar_days),
      NavItem.new(label: 'Season',    path: edit_admin_season_path,     icon: :cog,
                  match: %r{\A/admin/season})
    ]
  end

  def coordinator_nav
    [
      NavItem.new(label: 'Home',      path: coordinators_home_path,      icon: :home, exact: true),
      NavItem.new(label: 'Conflicts', path: coordinators_conflicts_path, icon: :calendar,
                  badge: pending_conflict_badge),
      NavItem.new(label: 'Files',     path: files_path,                  icon: :folder),
      NavItem.new(label: 'Inventory', path: inventory_categories_path,   icon: :cube),
      NavItem.new(label: 'Emails',    path: inventory_email_rules_path,  icon: :mail)
    ]
  end

  def staff_nav
    [
      NavItem.new(label: 'Home',  path: staff_home_path, icon: :home, exact: true),
      NavItem.new(label: 'Files', path: files_path,      icon: :folder)
    ] + inventory_nav_items
  end

  def member_nav
    [
      NavItem.new(label: 'Home',      path: members_home_path,         icon: :home, exact: true),
      NavItem.new(label: 'Pay Dues',  path: new_members_payment_path,  icon: :cash),
      # Lands on the list, not the form — reading is the common case, and the
      # list's own New button covers submitting.
      NavItem.new(label: 'See Conflicts', path: members_conflicts_path, icon: :calendar),
      NavItem.new(label: 'Files',           path: files_path,             icon: :folder),
      NavItem.new(label: 'My Fundraisers',  path: members_calendars_path, icon: :calendar_days)
    ] + inventory_nav_items
  end
end
