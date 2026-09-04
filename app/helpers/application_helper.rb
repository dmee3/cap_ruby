# frozen_string_literal: true

module ApplicationHelper
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
  NavItem = Struct.new(:label, :path, :icon, :badge, :match, keyword_init: true)

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

  def active_nav?(item)
    return request.path.match?(item.match) if item.match

    current_page?(item.path)
  end

  def user_initials(user)
    initials = "#{user.try(:first_name).to_s[0]}#{user.try(:last_name).to_s[0]}".upcase
    initials.presence || user.username.to_s[0, 2].upcase
  end

  private

  def admin_nav
    [
      NavItem.new(label: 'Home',      path: admin_home_path,            icon: :home, match: %r{\A/admin\z}),
      NavItem.new(label: 'Users',     path: admin_users_path,           icon: :users,
                  match: %r{\A/admin/users}),
      NavItem.new(label: 'Payments',  path: admin_payments_path,        icon: :cash,
                  match: %r{\A/admin/payment}),
      NavItem.new(label: 'Conflicts', path: admin_conflicts_path,       icon: :calendar,
                  match: %r{\A/admin/conflicts}),
      NavItem.new(label: 'Files',     path: files_path,                 icon: :folder),
      NavItem.new(label: 'Inventory', path: inventory_categories_path,  icon: :cube,
                  match: %r{\A/inventory/categor}),
      NavItem.new(label: 'Emails',    path: inventory_email_rules_path, icon: :mail),
      NavItem.new(label: 'Calendars', path: admin_calendars_path,       icon: :calendar_days)
    ]
  end

  def coordinator_nav
    [
      NavItem.new(label: 'Home',      path: coordinators_home_path,      icon: :home, match: %r{\A/coordinators\z}),
      NavItem.new(label: 'Conflicts', path: coordinators_conflicts_path, icon: :calendar,
                  match: %r{\A/coordinators/conflicts}),
      NavItem.new(label: 'Files',     path: files_path,                  icon: :folder),
      NavItem.new(label: 'Inventory', path: inventory_categories_path,   icon: :cube,
                  match: %r{\A/inventory/categor}),
      NavItem.new(label: 'Emails',    path: inventory_email_rules_path,  icon: :mail)
    ]
  end

  def staff_nav
    [
      NavItem.new(label: 'Home',  path: staff_home_path, icon: :home),
      NavItem.new(label: 'Files', path: files_path,      icon: :folder)
    ]
  end

  def member_nav
    items = [
      NavItem.new(label: 'Home',      path: members_home_path,         icon: :home, match: %r{\A/members\z}),
      NavItem.new(label: 'Pay Dues',  path: new_members_payment_path,  icon: :cash),
      NavItem.new(label: 'Conflict',  path: new_members_conflict_path, icon: :calendar),
      NavItem.new(label: 'Files',           path: files_path,             icon: :folder),
      NavItem.new(label: 'My Fundraisers',  path: members_calendars_path, icon: :calendar_days)
    ]
    if current_user&.quartermaster?
      items << NavItem.new(label: 'Inventory', path: inventory_categories_path, icon: :cube,
                           match: %r{\A/inventory/categor})
    end
    items
  end
end
