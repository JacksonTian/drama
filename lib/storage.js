/**
 * Provides methods to store and retrieve data based on Web Storage API.
 */

(function(global) {

    /**
     * Check whether the current environment (either provided by browser or by some JS library) supports
     * JSON.parse and JSON stringify.
     * @private
     */
    var bSupportJSON = !!(window.JSON && JSON.parse && JSON.stringify);
    /**
     * Prefix added to all storage keys (typically IDs) passed by the applications
     * when they are calling state storage methods. The goal of such prefix is to
     * leave space for saving data (with the same key) also scenarios other than 
     * state saving.    
     * @private
     */
    var sStateStorageKeyPrefix = "state.key_";

    /**
     * Constructor for an instance of jQuery.sap.storage.Storage
     * 
     * @param {Storage} [pStorage=storageType.session] the type this storage should be of or an Object implementing the typical Storage API for direct usage.
     * @param {String} [sStorageKeyPrefix=state.key_] the prefix to use in this storage.
     *
     * @private
     */
    var fStorage = function(pStorage, sStorageKeyPrefix){
        var sType = "unknown";
        var sPrefix = sStorageKeyPrefix || sStateStorageKeyPrefix;
        var oStorage;
        
        if(!oStorage || typeof(pStorage) === "string") {
            sType = pStorage || "session";
            oStorage = window[sType + "Storage"];
        } else if(typeof(pStorage) === Object) {
            sType = pStorage.getType ? pStorage.getType() : "unknown";
            oStorage = pStorage;
        }
        var bStorageAvailable = !!oStorage;

        /** 
         * Stores the passed state string in the session, under the key
         * sStateStorageKeyPrefix + sId
         *
         * @param {String} sId Id for the state to store
         * @param {String} sStateToStore content to store 
         * @return {boolean} true if the data were successfully stored, false otherwise
         * @public 
         */
        this.put = function(sId, sStateToStore) {
            //precondition: non-empty sId and available storage feature 
            if (bStorageAvailable && sId && sId.length>0) { 
                try {                    
                    oStorage.setItem(sPrefix+sId, bSupportJSON?JSON.stringify(sStateToStore):sStateToStore);
                    return true;
                } catch(e) {
                    return false;
                }
            } else {
                return false;
            }
        };

        /** 
         * Retrieves the state string stored in the session under the key
         * sStateStorageKeyPrefix + sId
         *
         * @param {String} sId Id for the state to retrieve
         * @return {String} the string from the storage, if the retrieval
         * was successfull, and null otherwise
         * @public 
         */
        this.get = function(sId) {
            //precondition: non-empty sId and available storage feature 
            if (bStorageAvailable && sId && sId.length>0) { 
                try {
                    var sItem=oStorage.getItem(sPrefix+sId);
                    return bSupportJSON?JSON.parse(sItem):sItem;
                } catch(e) {
                    return null;
                }
            } else {
                return null;
            }            
        };

        /** 
         * Deletes the state string stored in the session under the key
         * sStateStorageKeyPrefix + sId
         *
         * @param {String} sId Id for the state to delete
         * @return {boolean} true if the deletion
         * was successfull or the data doesn't exist under the specified key, 
         * and false if the feature is unavailable or a problem occured
         * @public 
         */
        this.remove = function(sId) {
            //precondition: non-empty sId and available storage feature 
            if (bStorageAvailable && sId && sId.length>0) { 
                try {
                    oStorage.removeItem(sPrefix+sId);
                    return true;
                } catch(e) {
                    return false;
                }
            } else {
                return false;
            }
        };
        
        /** 
         * Deletes all the entries saved in the session. 
         * CAUTION: This method should be called only in very particular situations,
         * when a global erasing of data is required. Given that the method deletes
         * the data saved under any ID, it should not be called when managing data
         * for specific controls. 
         *
         * @return {boolean} true if execution of removal
         * was successful or the data to remove doesn't exist, 
         * and false if the feature is unavailable or a problem occured
         * @public 
         */
        this.clear = function() {
            //precondition: available storage feature 
            if (bStorageAvailable) { 
                try {
                    oStorage.clear();
                    return true;
                } catch(e) {
                    return false;
                }
            } else {
                return false;
            }            
        };
        
        /**
         * Returns the type of the storage.
         * @returns {storageType || String} the type of the storage or "unknown"
         */
        this.getType = function(){
            return sType;
        };
    };

    /**
     * Namespace holding constants for specification of different storages supported by {@link jQuery.sap.storage.Storage} 
     * @version 0.15.0
     * @since 0.11.0
     * @namespace
     * @public
     */
    var storageType = {
        /**
         * Indicates usage of the browser's localStorage feature
         */
        local: "local", 
        /**
         * Indicates usage of the browser's sessionStorage feature
         */
        session: "session", 
        /**
         * Indicates usage of the browser's globalStorage feature
         */
        global: "global"
    };

    /**
     * A map holding instances of different 'standard' storages.
     * Used to limit number of created storage objects.
     * @private
     */
    var mStorages = {};
    
    /**
     *  
     */
    var storage = function(oStorage){
        // if nothing or the default was passed in, simply return ourself
        if(!oStorage) {
            oStorage = storageType.session;
        }
        
        if(typeof(oStorage) === "string" && storageType[oStorage]) {
            return mStorages[oStorage] || (mStorages[oStorage] = new fStorage(oStorage));
        }

        return new fStorage(oStorage);
    };

    global.getStorage = storage;
})(window);
