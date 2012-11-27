/**
 * Web Storage API wrapper.
 */

(function(global) {
    /**
     * @param {string} type The type this storage should be of or an Object implementing the typical Storage API for direct usage.
     * @param {string} prefix The prefix to use in this storage.
     */
    var _Storage = function (type, prefix) {
        prefix = prefix || "state.key_";
        var _storage = global[type + "Storage"];

        /** 
         * Stores the passed state string in the session, under the key
         * _prefix + key
         *
         * @param {string} key key for the state to store
         * @param {string} state content to store
         * @public 
         */
        this.put = function(key, state) {
            if (key) {
                _storage.setItem(prefix + key, JSON.stringify(state));
            } else {
                throw "key is empty.";
            }
        };

        /** 
         * Retrieves the state string stored in the session under the key
         * _prefix + key
         * @param {string} key key for the state to retrieve
         * @return {string} the string from the storage, if the retrieval was successfull, and null otherwise
         * @public 
         */
        this.get = function(key) {
            //precondition: non-empty key and available storage feature 
            if (key) { 
                var item = _storage.getItem(prefix + key);
                return JSON.parse(item);
            } else {
                throw "key is empty.";
            }
        };

        /** 
         * Deletes the state string stored in the session under the key
         * _prefix + key
         * @param {string} key key for the state to delete
         * @public 
         */
        this.remove = function(key) {
            //precondition: non-empty key and available storage feature 
            if (key) { 
                _storage.removeItem(prefix + key);
            }
        };

        /** 
         * Deletes all the entries saved in the session. 
         * CAUTION: This method should be called only in very particular situations,
         * when a global erasing of data is required. Given that the method deletes
         * the data saved under any ID, it should not be called when managing data
         * for specific controls. 
         * @public 
         */
        this.clear = function() {
            storage.clear();
        };

        /**
         * Returns the type of the storage.
         * @returns {string} the type of the storage
         */
        this.getType = function(){
            return type;
        };
    };

    /**
     * Namespace holding constants for specification of different storages supported
     * @namespace
     * @public
     */
    var storageType = {
            /**
             * localStorage
             */
            local: "local",
            /**
             * sessionStorage
             */
            session: "session", 
            /**
             * globalStorage
             */
            global: "session"
        };

    /**
     * A map holding instances of different 'standard' storages.
     * Used to limit number of created storage objects.
     * @private
     */
    var storageMap = {};

    global.getStorage = function (type) {
        // if nothing or the default was passed in, simply return ourself
        if (!storageMap.hasOwnProperty(type)) {
            if (!storageType.hasOwnProperty(type)) {
                type = storageType.session;
            }
            storageMap[type] = new _Storage(type);
        }
        return storageMap[type];
    };

})(window);
