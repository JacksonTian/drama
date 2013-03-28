/**
 * Web Storage API wrapper.
 */
(function (global) {

  /**
   * @param {String} type The type this storage should be of or an Object implementing the typical Storage API for direct usage.
   * @param {String} prefix The prefix to use in this storage.
   */
  var _Storage = function (type, prefix) {
    this.prefix = prefix || "prefix_";
    this.type = type;
    this.storage = global[type + "Storage"];
  };

  /**
   * Stores the passed state string in the session, under the key
   * @param {String} key key for the state to store
   * @param {String} state content to store
   */
  _Storage.prototype.put = function (key, state) {
    if (key) {
      this.storage.setItem(this.prefix + key, JSON.stringify(state));
    } else {
      throw new Error("key is empty.");
    }
  };

  /**
   * Retrieves the state string stored in the session under the key
   * @param {String} key key for the state to retrieve
   * @return {String} the string from the storage, if the retrieval was successfull, and null otherwise
   */
  _Storage.prototype.get = function (key) {
    // precondition: non-empty key and available storage feature
    if (key) {
      var item = this.storage.getItem(this.prefix + key);
      return JSON.parse(item);
    } else {
      throw new Error("key is empty.");
    }
  };

  /**
   * Deletes the state string stored in the session under the key
   * @param {String} key key for the state to delete
   */
  _Storage.prototype.remove = function (key) {
    //precondition: non-empty key and available storage feature
    if (key) {
      this.storage.removeItem(this.prefix + key);
    }
  };

  /**
   * Deletes all the entries saved in the session.
   */
  _Storage.prototype.clear = function () {
    this.storage.clear();
  };

  /**
   * Returns the type of the storage.
   * @returns {String} the type of the storage
   */
  _Storage.prototype.getType = function () {
    return this.type;
  };

  /**
   * Namespace holding constants for specification of different storages supported
   */
  var storageType = {
    local: "local", // localStorage
    session: "session" // sessionStorage
  };

  /**
   * cache
   */
  var storageMap = {};

  /**
   * Gets storage by type.
   * @param {String} type storage type, allow local/session
   */
  global.getStorage = function (type) {
    // if nothing or the default was passed in, simply return ourself
    if (!storageMap.hasOwnProperty(type)) {
      type = storageType.hasOwnProperty(type) ? type : 'session';
      storageMap[type] = new _Storage(type);
    }
    return storageMap[type];
  };
})(window);
