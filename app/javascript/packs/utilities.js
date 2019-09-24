export default class {
  static getAuthToken() {
    return document.querySelector('meta[name="csrf-token"]').content;
  }

  static getJWT() {
    return this.readCookie('jwt');
  }

  static readCookie(name) {
    var nameEQ = name + "=";
    var cookiesArray = document.cookie.split(';');

    for (var i=0; i < cookiesArray.length; i++) {
        var c = cookiesArray[i];

        // Trim whitespace
        while (c.charAt(0)==' ')
          c = c.substring(1, c.length);

        // Check for and return cookie value if we find a match
        if (c.indexOf(nameEQ) == 0)
          return c.substring(nameEQ.length, c.length);
    }

    return null;
  }
}
