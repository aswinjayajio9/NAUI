var o9Interface = (function () {

    var version = "1.2.240624";
    //Postmate Start
    //'use strict';

    var Postmate = {};

    var process = { env: { NODE_ENV: 'developement' } };
    var messageType = 'application/x-postmate-v1+json';
    var _messageId = 0;
    var generateNewMessageId = function generateNewMessageId() {
        return ++_messageId;
    };
    var log = function log() {
        var _console;

        return Postmate.debug ? (_console = console).log.apply(_console, arguments) : null;
    };
    var resolveOrigin = function resolveOrigin(url) {
        var a = document.createElement('a');
        a.href = url;
        var protocol = a.protocol.length > 4 ? a.protocol : window.location.protocol;
        var host = a.host.length ? a.port === '80' || a.port === '443' ? a.hostname : a.host : window.location.host;
        return a.origin || protocol + "//" + host;
    };
    var messageTypes = {
        handshake: 1,
        'handshake-reply': 1,
        call: 1,
        emit: 1,
        reply: 1,
        request: 1
    };
    var sanitize = function sanitize(message, allowedOrigin, frameContext) {
        if (message.data.postmate === 'handshake' && message.data.version !== version) {
            console.warn("Child: Version mismatch detected between Parent(" + message.data.version + ") and Child(" + version + ")");
        }
        if (frameContext !== message.source) return false;
        if (typeof allowedOrigin === 'string' && message.origin !== allowedOrigin) return false;
        if (!message.data) return false;
        if (typeof message.data === 'object' && !('postmate' in message.data)) return false;
        if (message.data.type !== messageType) return false;
        if (!messageTypes[message.data.postmate]) return false;
        return true;
    };
    var resolveValue = function resolveValue(model, property, data) {
        var unwrappedContext = typeof model[property] === 'function' ? model[property](data) : model[property];
        return Postmate.Promise.resolve(unwrappedContext);
    };
    var ChildAPI =
        function () {
            function ChildAPI(info) {
                var _this3 = this;

                this.model = info.model;
                this.parent = info.parent;
                this.parentOrigin = info.parentOrigin;
                this.child = info.child;
                this.secret_key = info.secret_key;

                log("Child: Received secret_key from parent");

                if (process.env.NODE_ENV !== 'production') {
                    log('Child: Registering API');
                    log('Child: Awaiting messages...');
                }

                this.child.addEventListener('message', function (e) {
                    if (!sanitize(e, _this3.parentOrigin, _this3.parent)) return;

                    if (process.env.NODE_ENV !== 'production') {
                        log('Child: Received request', e.data);
                    }

                    var _e$data = e.data,
                        property = _e$data.property,
                        uid = _e$data.uid,
                        data = _e$data.data;

                    if (e.data.postmate === 'call') {
                        if (property in _this3.model && typeof _this3.model[property] === 'function') {
                            _this3.model[property](data);
                        }
                    } // Reply to Parent

                    if (e.data.postmate === "request") {
                        resolveValue(_this3.model, property, data).then(function (value) {
                            log("Child: Sending secret_key from child for reply");
                            return e.source.postMessage({
                                property: property,
                                postmate: 'reply',
                                type: messageType,
                                uid: uid,
                                value: value,
                                secret_key: this.secret_key,
                                version: version
                            }, e.origin);
                        });
                    }
                });
            }

            var _proto2 = ChildAPI.prototype;

            _proto2.emit = function emit(name, data) {
                if (process.env.NODE_ENV !== 'production') {
                    log("Child: Emitting Event \"" + name + "\"", data);
                }
                log("Child:Sending secret_key from child for emit");
                this.parent.postMessage({
                    postmate: 'emit',
                    type: messageType,
                    value: {
                        name: name,
                        data: data
                    },
                    secret_key: this.secret_key,
                    version: version
                }, this.parentOrigin);
            };

            _proto2.get = function get(property, payload) {
                var _this4 = this;
                if (process.env.NODE_ENV !== 'production') {
                    log("Child: Requesting from Parent : " + property);
                }

                return new Postmate.Promise(function (resolve) {
                    // Extract data from response and kill listeners
                    var uid = generateNewMessageId();

                    var transact = function transact(e) {
                        if (!sanitize(e, _this4.parentOrigin, _this4.parent)) return;

                        if (e.data.uid === uid && e.data.postmate === 'reply') {
                            _this4.child.removeEventListener('message', transact, false);

                            resolve(e.data.value);
                        }
                    }; // Prepare for response from Parent...


                    _this4.child.addEventListener('message', transact, false); // Then ask Parent for information

                    var data = {
                        property: property,
                        uid: uid,
                        payload: payload
                    };
                    log("Child: Sending secret_key from child for request");
                    _this4.parent.postMessage({
                        postmate: 'request',
                        type: messageType,
                        value: {
                            name: property,
                            data: data
                        },
                        secret_key: _this4.secret_key,
                        version: version
                    }, _this4.parentOrigin);
                });

            };

            return ChildAPI;
        }();

    Postmate.debug = false;

    Postmate.Promise = function () {
        try {
            return window ? window.Promise : Promise;
        } catch (e) {
            return null;
        }
    }();

    Postmate.Model =
        function () {
            function Model(model) {
                this.child = window;
                this.model = model;
                this.parent = this.child.parent;
                return this.sendHandshakeReply();
            }
            var _proto4 = Model.prototype;

            _proto4.sendHandshakeReply = function sendHandshakeReply() {
                var _this5 = this;

                return new Postmate.Promise(function (resolve, reject) {
                    var shake = function shake(e) {
                        if (!e.data.postmate) {
                            return;
                        }

                        if (!sanitize(e, _this5.parentOrigin, _this5.parent)) return;

                        if (e.data.postmate === 'handshake') {
                            if (process.env.NODE_ENV !== 'production') {
                                log('Child: Received handshake from Parent');
                            }

                            _this5.child.removeEventListener('message', shake, false);

                            if (process.env.NODE_ENV !== 'production') {
                                log('Child: Sending handshake reply to Parent');
                            }

                            e.source.postMessage({
                                postmate: 'handshake-reply',
                                type: messageType,
                                version: version
                            }, e.origin);
                            _this5.parentOrigin = e.origin; // Extend model with the one provided by the parent
                            _this5.secret_key = e.data.secret_key;

                            var defaults = e.data.model;

                            if (defaults) {
                                Object.keys(defaults).forEach(function (key) {
                                    _this5.model[key] = defaults[key];
                                });

                                if (process.env.NODE_ENV !== 'production') {
                                    log('Child: Inherited and extended model from Parent');
                                }
                            }

                            if (process.env.NODE_ENV !== 'production') {
                                log('Child: Saving Parent origin', _this5.parentOrigin);
                            }

                            return resolve(new ChildAPI(_this5));
                        }

                        return reject('Handshake Reply Failed');
                    };

                    _this5.child.addEventListener('message', shake, false);
                });
            };

            return Model;
        }();

    //Postmate End

    var _o9Connection = undefined;
    Postmate.debug = true;
    var _createPostmateModelInstance = function () {
        const handshake = new Postmate.Model({
            onEvent: function (eventObj) {
                return _o9Connection.onParentEvent(eventObj);
            }
        });
        return handshake;
    };
    var _maxAttempts = 25;

    var _handshake = function (postmateModelInstance) {
        postmateModelInstance.then(parent => {
            _o9Connection = (function () {
                var _parentContext = parent;
                var _ready = false;
                var _readyEmitDone = false;
                var _parentEventCallback = undefined;
                var self = this;

                var getLoggedInUser = function (callback) {
                    _parentContext.get('getLoggedInUser').then(function (result) {
                        log("Below is the LoggedIn User Object");
                        return callback(result);
                    });
                };

                var getData = function (payload, callback) {
                    _parentContext.get('getData', payload).then(function (result) {
                        return callback(result);
                    });
                };

                var getMeta = function (payload, callback) {
                    _parentContext.get('getMeta', payload).then(function (result) {
                        return callback(result);
                    });
                };

                var cellEdit = function (payload, callback) {
                    _parentContext.get('cellEdit', payload).then(function (result) {
                        return callback(result);
                    });
                };

                var cellLock = function (payload, callback) {
                    _parentContext.get('cellLock', payload).then(function (result) {
                        return callback(result);
                    });
                };

                var cellUnlock = function (payload, callback) {
                    _parentContext.get('cellUnlock', payload).then(function (result) {
                        return callback(result);
                    });
                };

                var cellFreeze = function (payload, callback) {
                    _parentContext.get('cellFreeze', payload).then(function (result) {
                        return callback(result);
                    });
                };

                var cellUnfreeze = function (payload, callback) {
                    _parentContext.get('cellUnfreeze', payload).then(function (result) {
                        return callback(result);
                    });
                };

                var executeAction = function (payload, callback) {
                    _parentContext.get('executeAction', payload).then(function (result) {
                        return callback(result);
                    });
                };

                var getPicklists = function (payload, callback) {
                    _parentContext.get('getPicklists', payload).then(function (result) {
                        return callback(result);
                    });
                };

                var navigate = function (payload, callback) {
                    _parentContext.get('navigate', payload).then(function (result) {
                        if (result.error) {
                            console.log("Child:Some error occured while navigating to the view!!");
                        }
                        if (callback) {
                            return callback(result);
                        }
                    });
                };

                var updateUserPresentationData = function (payload) {
                    _parentContext.get("updateUserPresentation", payload).then(function (result) {
                        if (result.error) {
                            console.log("Child: Some error occurred in updating presentation info!!");
                        }
                    });
                };

                var notifyLinkedWidgets = function (payload) {
                    _parentContext.get("notifyLinkedWidgets", payload).then(function (result) {
                        if (result.error) {
                            console.log("Child:Some error occured in notifying the linked widgets!!");
                        }
                    });
                };

                var sendReady = function () {
                    if (!_readyEmitDone) {
                        _readyEmitDone = true;
                        log("Inside sendReady method!");
                        _parentContext.emit("ready");
                    } else {
                        console.log("Emit already Done");
                    }
                };

                var setParentEventCallback = function (callback) {
                    _parentEventCallback = callback;
                    sendReady();
                };

                var onParentEvent = function (eventObject) {
                    _ready = true;
                    if (_parentEventCallback) {
                        return _parentEventCallback(eventObject);
                    }
                };

                var getReportDetails = function (callback) {
                    _parentContext.get('getReportDetails').then(function (result) {
                        return callback(result);
                    });
                };

                var isReady = function () {
                    return _ready;
                };

                var getEmbedRequestHeaders = function (callback) {
                    _parentContext.get('getEmbedRequestHeaders').then(function (result) {
                        console.log("Below is the Embed Request Headers");
                        return callback(result);
                    });
                };

                var getEmbedToken = function (callback) {
                    _parentContext.get('getEmbedToken').then(function (result) {
                        console.log("Below is the Embed Token");
                        return callback(result);
                    });
                };

                function o9DataSource() {
                    self.data = {
                        Meta: [],
                        Data: []
                    };
                }
                o9DataSource.prototype.toJson = function () {
                    var jsonString = JSON.stringify(self.data);
                    return JSON.parse(jsonString);
                };
                o9DataSource.prototype.reset = function () {
                    self.data = {
                        Meta: [],
                        Data: []
                    };
                };
                o9DataSource.prototype.clearData = function () {
                    if (!parent.data) {
                        parent.data = {
                            Meta: [],
                            Data: []
                        };
                    }
                    parent.data.Data = [];
                };
                o9DataSource.prototype.addAttributeColumnDef = function (def) {
                    console.log('attribute def', def);
                    var requiredFields = ["DimensionName", "AttributeName", "RelationshipType", "EdgeDirection", "DimensionValues"];
                    for (var key of requiredFields) {
                        if (!(key in def)) {
                            throw new Error(`Missing required field: ${key}`);
                        }
                    }
                    self.data.Meta.push(def);
                };
                o9DataSource.prototype.addMeasureColumnDef = function (def) {
                    var requiredFields = ["Name", "DataType", "DisplayName", "FormatString"];
                    for (var key of requiredFields) {
                        if (!(key in def)) {
                            throw new Error(`Missing required field: ${key}`);
                        }
                    }
                    self.data.Meta.push(def);
                };
                o9DataSource.prototype.addAttributeData = function (rowIndex, columnIndex, value) {
                    if (!self.data.Data[rowIndex]) {
                        self.data.Data[rowIndex] = [];
                    }
                    self.data.Data[rowIndex][columnIndex] = (value !== null && value !== undefined && value !== '') ? value : null;
                };
                o9DataSource.prototype.addMeasureData = function (rowIndex, columnIndex, value) {
                    if (!self.data.Data[rowIndex]) {
                        self.data.Data[rowIndex] = [];
                    }
                    self.data.Data[rowIndex][columnIndex] = (value !== null && value !== undefined && value !== '') ? [value] : [null];
                };
                o9DataSource.prototype.deleteRow = function (rowIndex) {
                    if (rowIndex >= 0 && rowIndex < self.data.Data.length) {
                        self.data.Data.splice(rowIndex, 1);
                    } else {
                        throw new Error("Row index out of range");
                    }
                };
                o9DataSource.prototype.getAttributeColumnIndex = function (DimensionName, AttributeName, RelationshipType, EdgeDirection) {
                    var index = -1;
                    var meta = self.data.Meta;
                    if (meta && meta.length > 0 && DimensionName && AttributeName) {
                        index = meta.findIndex(function (obj) {
                            return obj.DimensionName === DimensionName && obj.AttributeName === AttributeName && obj.EdgeDirection === EdgeDirection && obj.RelationshipType === RelationshipType;
                        });
                    }
                    return index;
                };
                o9DataSource.prototype.getMeasureColumnIndex = function (Name, RelationshipType) {
                    var index = -1;
                    var meta = self.data.Meta;
                    if (meta && meta.length > 0 && Name) {
                        index = meta.findIndex(function (obj) {
                            return obj.Name === Name && obj.RelationshipType === RelationshipType;
                        });
                    }
                    return index;
                };

                return {
                    getData: getData,
                    getMeta: getMeta,
                    cellEdit: cellEdit,
                    cellLock: cellLock,
                    cellUnlock: cellUnlock,
                    cellFreeze: cellFreeze,
                    cellUnfreeze: cellUnfreeze,
                    executeAction: executeAction,
                    getPicklists: getPicklists,
                    navigate: navigate,
                    updateUserPresentationData: updateUserPresentationData,
                    notifyLinkedWidgets: notifyLinkedWidgets,
                    getLoggedInUser: getLoggedInUser,
                    sendReady: sendReady,
                    setParentEventCallback: setParentEventCallback,
                    onParentEvent: onParentEvent,
                    getReportDetails: getReportDetails,
                    isReady: isReady,
                    getEmbedRequestHeaders: getEmbedRequestHeaders,
                    getEmbedToken: getEmbedToken,
                    o9DataSource: o9DataSource
                };
            })();
        });
    };

    var _init = function () {
        var postmateModelInstance = _createPostmateModelInstance();
        _handshake(postmateModelInstance);
    };

    _init();

    var isReady = function () {
        if (_o9Connection && _o9Connection.isReady()) {
            return true;
        }
        return false;
    };

    var getData = function (payloadData, requestParams, callback) {
        var payload = { 'payloadData': payloadData, 'requestParams': requestParams };
        if (isReady()) {
            _o9Connection.getData(payload, callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    var getMeta = function (payloadData, requestParams, callback) {
        var payload = { 'payloadData': payloadData, 'requestParams': requestParams };
        if (isReady()) {
            _o9Connection.getMeta(payload, callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    var cellEdit = function (payloadData, requestParams, callback) {
        var payload = { 'payloadData': payloadData, 'requestParams': requestParams };
        if (isReady()) {
            _o9Connection.cellEdit(payload, callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    var cellLock = function (payloadData, requestParams, callback) {
        var payload = { 'payloadData': payloadData, 'requestParams': requestParams };
        if (isReady()) {
            _o9Connection.cellLock(payload, callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    var cellUnlock = function (payloadData, requestParams, callback) {
        var payload = { 'payloadData': payloadData, 'requestParams': requestParams };
        if (isReady()) {
            _o9Connection.cellUnlock(payload, callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    var cellFreeze = function (payloadData, requestParams, callback) {
        var payload = { 'payloadData': payloadData, 'requestParams': requestParams };
        if (isReady()) {
            _o9Connection.cellFreeze(payload, callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    var cellUnfreeze = function (payloadData, requestParams, callback) {
        var payload = { 'payloadData': payloadData, 'requestParams': requestParams };
        if (isReady()) {
            _o9Connection.cellUnfreeze(payload, callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };
    var executeAction = function (actionButtonName, payloadData, requestParams, callback) {
        var payload = { 'payloadData': payloadData, 'requestParams': requestParams, 'actionButtonName': actionButtonName };
        if (isReady()) {
            _o9Connection.executeAction(payload, callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };
    var getPicklists = function (payloadData, requestParams, callback) {
        var payload = { 'payloadData': payloadData, 'requestParams': requestParams };
        if (isReady()) {
            _o9Connection.getPicklists(payload, callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };
    var navigate = function (payloadData, callback) {
        var payload = { 'payloadData': payloadData };
        if (isReady()) {
            _o9Connection.navigate(payload, callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    var updateReportPresentationData = function (payloadData) {
        var payload = { 'payloadData': payloadData };
        if (isReady()) {
            _o9Connection.updateUserPresentationData(payload);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    var notifyLinkedWidgets = function (payloadData) {
        var payload = { 'payloadData': payloadData };
        if (isReady()) {
            _o9Connection.notifyLinkedWidgets(payload);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    var _waitForConnection = function (callback, attempt) {
        //console.log("Attempt: " + attempt);
        if (_o9Connection) {
            callback();
        } else {
            if (!attempt) { attempt = 0; }
            if (attempt !== _maxAttempts) {
                setTimeout(function () { _waitForConnection(callback, attempt + 1); }, 500);
            }
        }
    };

    var _sendReady = function (callback) {
        if (isReady()) {
            return callback();
        } else {
            _waitForConnection(function () {
                _o9Connection.sendReady();
                return callback();
            });
        }
    };

    var _waitForReady = function (callback, attempt) {
        _waitForConnection(function () {
            if (isReady()) {
                callback();
            } else {
                if (!attempt) { attempt = 0; }
                if (attempt !== _maxAttempts) {
                    setTimeout(function () { _waitForReady(callback, attempt + 1); }, 500);
                }
            }
        });
    };

    var register = function (callback) {
        _waitForConnection(function () {
            _o9Connection.setParentEventCallback(callback);
        });
    };

    var getReportDetails = function (callback) {
        _sendReady(function () {
            _waitForReady(function () {
                _o9Connection.getReportDetails(callback);
            });
        });
    };

    var getLoggedInUser = function (callback) {
        if (isReady()) {
            _o9Connection.getLoggedInUser(callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    var getEmbedRequestHeaders = function (callback) {
        if (isReady()) {
            _o9Connection.getEmbedRequestHeaders(callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    var getEmbedToken = function (callback) {
        if (isReady()) {
            _o9Connection.getEmbedToken(callback);
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    var o9DataSource = function () {
        if (isReady()) {
            return new _o9Connection.o9DataSource();
        } else {
            console.log("Connection not estabilished yet!!");
        }
    };

    return {
        isReady: isReady,
        getData: getData,
        getMeta: getMeta,
        cellEdit: cellEdit,
        cellLock: cellLock,
        cellUnlock: cellUnlock,
        cellFreeze: cellFreeze,
        cellUnfreeze: cellUnfreeze,
        executeAction: executeAction,
        getPicklists: getPicklists,
        navigate: navigate,
        register: register,
        getReportDetails: getReportDetails,
        getLoggedInUser: getLoggedInUser,
        updateReportPresentationData: updateReportPresentationData,
        notifyLinkedWidgets: notifyLinkedWidgets,
        getEmbedRequestHeaders: getEmbedRequestHeaders,
        getEmbedToken: getEmbedToken,
        o9DataSource: o9DataSource
    };
})();


if (typeof module !== "undefined" && module.exports) {
    module.exports = o9Interface;
}
