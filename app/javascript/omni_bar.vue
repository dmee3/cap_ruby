<template>
  <div class="w-75 position-relative">
    <input
      type="text"
      class="form-control w-100"
      id="omni-bar-input"
      placeholder="Member Search"
      tabindex="1"
      @keydown="handleKeydown"
      @input="handleInput"
    >
    <div v-show="listVisible" class="dropdown-menu show w-100" id="omni-bar-results">
      <div
        v-for="(entry, index) in displayedList"
        :key="entry.id"
        class="dropdown-item"
        :class="{'highlighted' : index === highlighted}"
      >
        <a class="text-body" v-if="entry.type == 'member'" :href="entry.url">
          <i class="fas fa-user text-muted"></i> {{entry.fullName}} <small class="text-muted">{{entry.section}}</small>
        </a>

        <a class="text-body" v-if="entry.type == 'link'" :href="entry.url">
          <i class="fas fa-link text-muted"></i> {{entry.description}}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import Utilities from './packs/utilities';
import fuzzysort from 'fuzzysort';

export default {
  data: function() {
    return {
      displayedList: [],
      error: [],
      highlighted: -1,
      listVisible: false,
      entryList: []
    }
  },
  methods: {
    filterList(searchTerm) {
      if (searchTerm.length < 2) {
        this.displayedList = [];
        return;
      }

      this.displayedList = fuzzysort.go(searchTerm, this.entryList, {
        allowTypo: true,
        key: 'searchStr',
        threshold: -50
      }).map(item => item.obj);
    },
    handleInput(event) {
      const value = event.target.value;
      this.filterList(value);

      if (this.displayedList.length > 0) {
        this.showList();
      } else {
        this.hideList();
      }
    },
    handleKeydown(event) {
      switch (event.keyCode) {
        // Enter
        case 13:
          if (this.highlighted >= 0 && this.highlighted < this.displayedList.length) {
            const selectedMember = this.displayedList[this.highlighted];
            window.location.href = selectedMember.url;
          }
          break;

        // Arrow Up
        case 38:
          if (this.highlighted > 0) {
            this.highlighted--;
            event.preventDefault();
          }
          break;

        // Arrow Down
        case 40:
          if (this.highlighted < this.displayedList.length - 1) {
            this.highlighted++;
            event.preventDefault();
          }
          break;

        // All other keys
        default:
          break;
      }
    },
    showList() {
      // If the list was previously hidden, highlight the first entry
      if (this.listVisible == false) {
        this.highlighted = 0;
      }

      this.listVisible = true;
    },
    hideList() {
      this.listVisible = false;
    },
    addStaticListEntries() {
      this.entryList.push(
        { type: 'link', id: -1, url: `/`, searchStr: 'home', description: 'Home' },
        { type: 'link', id: -2, url: `/admin/users`, searchStr: 'users', description: 'Users' },
        { type: 'link', id: -3, url: `/admin/users/new`, searchStr: 'new user', description: 'New User' },
        { type: 'link', id: -4, url: `/admin/conflicts`, searchStr: 'conflicts', description: 'Conflicts' },
        { type: 'link', id: -5, url: `/admin/conflicts/new`, searchStr: 'new conflict', description: 'New Conflict' },
        { type: 'link', id: -6, url: `/admin/payments`, searchStr: 'payments', description: 'Payments' },
        { type: 'link', id: -7, url: `/admin/payments/new`, searchStr: 'new payment', description: 'New Payment' },
        { type: 'link', id: -8, url: `/documents`, searchStr: 'documents', description: 'Documents' }
      )
    }
  },
  mounted: function() {
    const self = this;
    $.getJSON('/admin/users', { jwt: Utilities.getJWT() })
      .done(function(response) {
        self.entryList = response.users.map((member) => {
          return {
            id: member['id'],
            firstName: member['first_name'],
            lastName: member['last_name'],
            fullName: member['first_name'] + ' ' + member['last_name'],
            section: member['section'],
            type: 'member',
            searchStr: member['first_name'] + ' ' + member['last_name'] + ' ' + member['section'],
            url: `/admin/users/${member['id']}`
          }
        })
        self.addStaticListEntries();
      })
      .fail(function(err) {
        console.log(err);
      });
  }
}
</script>
