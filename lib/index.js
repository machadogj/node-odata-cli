var request = require('request'),
    extend = require('node.extend');
var odata,
    odataUri,
    odataQuery,
    odataQueryResult,
    serviceCall;

odataUri = require('./odataUri');

odata = function (uri, options) {
    ///	<summary>
    ///		Create a new OData object that can be used to query against
    ///     the specified service root URI.
    ///	</summary>
    ///	<returns type="odata" />
    var that;

    // constructs the odata object and assign data to it
    that = {};
    that.settings = options || {};
    that.uri = odataUri(uri);

    // if protocol is jsonp, $format=json needs to 
    // be added to the query string options.
    if (that.settings.dataType !== undefined && that.settings.dataType === 'jsonp') {
        that.uri.segments.options.format = 'json';
        that.uri.segments.options.callback = 'resultCallback';
    }

    that.from = function (resourcePath) {
        ///	<summary>
        ///		Create a new OData Query object that defines a new query
        ///     which can be used to query against the OData service root URI.
        ///	</summary>
        ///	<returns type="odataQuery" />
        ///	<param name="resourcePath" type="String">
        ///		The resource path to query on the OData service.
        ///	</param>    
        return odataQuery.apply(extend({}, this), [resourcePath]);
    };

    that.beforeRequest = function ( handler ) {
        ///<sumary>
        ///     
        ///</summary>
        ///<param name="handler" type="function">
        ///     Function that manipulates the req object before the HTTP call is done.
        ///</param>
        
        that.settings.beforeRequestHandler = handler;

        return that;
    };

    that.query = function (options) {
        ///	<summary>
        ///		Queries the OData service.
        ///	</summary>

        // allow users to pass in just a callback 
        // function in case of success.
        if (typeof options === 'function') {
            options = { callback: options };
        }

        serviceCall(this, options);
    };

    that.create = function (resourcePath, entry, options) {
        ///	<summary>
        ///		Create a new entry on the specified OData resource path.
        ///	</summary>
        var that;

        // allow users to pass in just a callback 
        // function in case of success.
        if (typeof options === 'function') {
            options = { callback: options };
        }

        options.type = "POST";
        options.data = JSON.stringify(entry);

        // create new OData Query object
        that = extend(true, {}, this);
        that.uri.segments.resource = resourcePath;

        serviceCall(that, options);
    };

    that.update = function (resourcePath, entry, options) {
        ///	<summary>
        ///		Update an entry on the specified OData resource path.
        ///	</summary>
        var that,
            settings,
            defaults = {
                partial: true,
                force: false,
                etag: null
            };

        // allow users to pass in just a callback 
        // function in case of success.
        if (typeof options === 'function') {
            options = { callback: options };
        }

        // look for etag in entry.__metadata.
        if (options.etag === undefined && entry.__metadata !== undefined && entry.__metadata.etag !== undefined) {
            options.etag = entry.__metadata.etag;
        }

        // copy options from user
        settings = extend({}, defaults, options);

        // if partialUpdate is true we must use HTTP MERGE
        settings.type = settings.partial ? "MERGE" : "PUT";


        // if updating a value directly, use 'text/plain' content type.
        if (typeof entry === 'object') {
            settings.data = JSON.stringify(entry);
            settings.contentType = 'application/json';
        }
        else {
            settings.data = entry.toString();
            settings.contentType = 'text/plain';
        }

        // create new OData Query object
        that = extend(true, {}, this);
        that.uri.segments.resource = resourcePath;
        serviceCall(that, settings);
    };

    that['delete'] = that.deleteEntry = that.remove = function (entry, options) {
        var that,
            settings,
            defaults = {
                force: false,
                etag: null
            };

        // allow users to pass in just a callback 
        // function in case of success.
        if (typeof options === 'function') {
            options = { callback: options };
        }

        // look for etag in entry.__metadata.
        if (options.etag === undefined && entry.__metadata !== undefined && entry.__metadata.etag !== undefined) {
            options.etag = entry.__metadata.etag;
        }

        // copy options from user
        settings = extend({}, defaults, options);

        // if forceUpdate is true, ignore possible ETag and always override 
        if (settings.force) {
            settings.etag = '*';
        }

        settings.type = "DELETE";

        // create new OData Query object
        that = extend(true, {}, this);

        // if entry is a object, look for uri in __metadata.uri.
        // else we assume that entry is a string, i.e. the resource path
        // to the entry that should be deleted.
        if (typeof entry === 'object') {
            if (entry.__metadata !== undefined && entry.__metadata.uri !== undefined) {
                // if we get a entry object with metadata, pick the uri from that
                that.uri = that.uri.parse(entry.__metadata.uri);
            }
            else {
                // otherwise assume an odataUri object
                that.uri = entry;
            }
        } else if (typeof entry === 'string') {
            that.uri = that.uri.parse(entry);
        }
        serviceCall(that, settings);
    };

    return that;
};

odataQuery = function (resourcePath) {
    ///	<summary>
    ///		Create a new OData Query object that defines a new query
    ///     which can be used to query against the OData service root URI.
    ///	</summary>
    ///	<returns type="odataQuery" />
    ///	<param name="resourcePath" type="String">
    ///		The resource path to query on the OData service.
    ///	</param>    
    var that = this,
        value,
        count,
        links,
        params,
        orderby,
        top,
        skip,
        filter,
        expand,
        select,
        inlinecount,
        withId;

    withId = function ( id ) {
        /// <summary>
        ///     Adds the id to the resource.
        /// </summary>
        /// <returns type="odataQuery" />
        /// <param name="id" type="String">
        /// </param>
        var that;

        that = extend(true, {}, this);

        if (!isNaN(id)) {
            that.uri.segments.resource = that.uri.segments.resource + "(" + id  + "L)";    
        } else {
            that.uri.segments.resource = that.uri.segments.resource + "(" + id  + ")";    
        }
        

        return that;
    };

    links = function (navigationProperty) {
        ///	<summary>
        ///     Retrive URI for the specified navigation property.
        ///	</summary>
        ///	<returns type="odataQuery" />
        ///	<param name="navigationProperty" type="String">
        ///	</param>                
        var that;

        // create new OData Query object
        that = extend(true, {}, this);
        that.uri.segments.links = navigationProperty;

        return that;
    };

    orderby = function (orderbyQueryOption) {
        ///	<summary>
        ///		The orderby System Query Option specifies an expression for determining 
        ///     what values are used to order the collection of Entries identified by 
        ///     the Resource Path section of the URI.
        ///	</summary>
        /// <remarks>
        ///     This query option is only supported when the resource path identifies a Collection of Entries.
        /// </remarks>
        ///	<returns type="odataQuery" />
        ///	<param name="orderbyQueryOption" type="String">
        ///		Examples: "Rating asc"
        ///               "Rating,Category/Name desc"
        ///	</param>                
        var that;

        // create new OData Query object
        that = extend(true, {}, this);
        that.uri.segments.options.orderby = orderbyQueryOption;

        return that;
    };

    top = function (numberOfEntries) {
        ///	<summary>
        ///		Specify the maximum amount of entries to return from the 
        ///     Collection of Entries identified by the Resource Path in this query object.
        ///	</summary>
        ///	<returns type="odataQuery" />
        ///	<param name="numberOfEntries" type="Number">
        ///		Maximum number of entries to return.
        ///	</param>                
        var that;

        // create new OData Query object
        that = extend(true, {}, this);
        that.uri.segments.options.top = numberOfEntries;

        return that;
    };

    skip = function (numberOfEntries) {
        ///	<summary>
        ///		Specify the amount of entries to skip in the resultset.
        ///	</summary>
        ///	<returns type="odataQuery" />
        ///	<param name="numberOfEntries" type="Number">
        ///		Number of entries to skip.
        ///	</param>                
        var that;

        // create new OData Query object
        that = extend(true, {}, this);
        that.uri.segments.options.skip = numberOfEntries;

        return that;
    };

    filter = function (filter) {
        ///	<summary>
        ///		A filter expression used to filter out entries in the resultset.
        ///	</summary>
        ///	<returns type="odataQuery" />
        ///	<param name="filter" type="String">
        ///		A valid OData filter expression string.
        ///	</param>                
        var that;

        // create new OData Query object
        that = extend(true, {}, this);
        that.uri.segments.options.filter = filter;

        return that;
    };

    expand = function (entries) {
        ///	<summary>
        ///		Indicate that Entries associated with the Entry or Collection 
        ///     of Entries identified by the Resource Path section of the 
        ///     URI must be represented inline (i.e. eagerly loaded).
        ///	</summary>
        ///	<returns type="odataQuery" />
        ///	<param name="entries" type="String">
        ///		The syntax of a $expand query option is a comma-separated 
        ///     list of Navigation Properties.
        ///     Additionally each Navigation Property can be followed by 
        ///     a forward slash and another Navigation Property 
        ///     to enable identifying a multi-level relationship.
        ///	</param>                
        var that;

        // create new OData Query object
        that = extend(true, {}, this);
        that.uri.segments.options.expand = entries;

        return that;
    };

    select = function (properties) {
        ///	<summary>
        ///     A comma seperated list of properties to return.
        ///	</summary>
        ///	<returns type="odataQuery" />
        ///	<param name="properties" type="String">            
        ///	</param>                
        var that;

        // create new OData Query object
        that = extend(true, {}, this);
        that.uri.segments.options.select = properties;

        return that;
    };

    inlinecount = function (inlinecount) {
        ///	<summary>
        ///     A comma seperated list of properties to return.
        ///	</summary>
        ///	<returns type="odataQuery" />
        ///	<param name="inlinecount" type="String">
        ///	</param>                
        var that;

        // set default value if inlinecount argument is not specified
        inlinecount = inlinecount === undefined ? true : inlinecount;

        // create new OData Query object
        that = extend(true, {}, this);
        that.uri.segments.options.inlinecount = inlinecount;

        return that;
    };

    params = function (params) {
        ///	<summary>
        ///		Assign Service Operations parameters to this OData Query object.
        ///	</summary>
        ///	<returns type="odataQuery" />
        ///	<param name="params" type="Object">
        ///		Argument must be in the form of an object.
        ///	</param>                
        var that;

        // create new OData Query object
        that = extend(true, {}, this);

        // add params to query options object
        that.uri.segments.options.params = params;

        return that;
    };

    count = function (args) {
        ///	<summary>
        ///		Retrives the number of entries associated resource path.
        ///	</summary>
        ///	<returns type="odataQuery" />
        var that,
            autoQuery = true,
            options = args;

        if (typeof args === 'boolean') {
            autoQuery = args;
        } else if (typeof args === 'function') {
            options = { success: args };
        } else if (args === undefined) {
            autoQuery = false;
        }

        // create new OData Query object
        that = extend(true, {}, this);

        // add count query string to query options object
        that.uri.segments.count = true;

        if (autoQuery) {
            // execute the query
            that.query(options);
        }
        else {
            return that;
        }
    };

    value = function (args) {
        ///	<summary>
        ///		Retrives the "raw value" of the specified property
        ///	</summary>
        ///	<returns type="odataQuery" />
        var that,
            autoQuery = true,
            options = args;

        if (typeof args === 'boolean') {
            autoQuery = args;
        } else if (typeof args === 'function') {
            options = { success: args };
        } else if (args === undefined) {
            autoQuery = false;
        }

        // create new OData Query object
        that = extend(true, {}, this);

        // add value query string to query options object
        that.uri.segments.value = true;

        if (autoQuery) {
            // execute the query
            that.query(options);
        }
        else {
            return that;
        }
    };

    that.uri.segments.resource = resourcePath;

    // add methods
    that.value = value;
    that.count = count;
    that.params = params;
    that.orderby = orderby;
    that.top = top;
    that.skip = skip;
    that.filter = filter;
    that.expand = expand;
    that.select = select;
    that.links = links;
    that.inlinecount = inlinecount;
    that.withId = withId;

    return that;
};

odataQueryResult = function (data, xhr, query) {
    var that = {};

    that.data = data.d === undefined ? data : data.d;
    if (xhr !== undefined) {
        that.version = xhr.getResponseHeader("DataServiceVersion").replace(';', '');
        that.ETag = xhr.getResponseHeader("ETag");
        that.status = xhr.status;
        that.statusText = xhr.statusText;
    }
    that.query = query;

    return that;
};

serviceCall = function (query, options) {
    var settings,
        defaults = {
            contentType: 'application/atom+xml',
            dataType: 'json',
            etag: null,
            type: "GET"
        };

    // extend settings with options and defaults.
    settings = extend({}, defaults, query.settings, options);

    // select dataType based on query
    if (settings.type === 'GET') {
        if (query.uri.value) {
            settings.dataType = '*/*';
        } else if (query.uri.count) {
            settings.dataType = 'text';
        }
    }
    // DataServiceVersion must be 2.0 if using
    // $count, $inlinecount or $select query options

    var req = {
        headers: {
            'MaxDataServiceVersion':'2.0',
            'DataServiceVersion': (query.uri.segments.count || query.uri.segments.options.inlinecount || query.uri.segments.options.select !== undefined)
                ? '2.0'
                : '1.0',
            "Accept": "application/json",
            "Content-Type":"application/json"
        },
        body: settings.data,
        timeout: settings.timeout,
        method: settings.type,
        url: query.uri.toString()
    };

    //console.log('uri: ' + JSON.stringify(req.url));

    if (settings.etag !== null) {
        req.header = req.header || {};
        req.header['If-Match'] = settings.etag;
    }
/*
    if (settings.type === "DELETE" || options.type === "PUT" || options.type === "MERGE") {
        req.header['X-HTTP-Method'] = options.type;
    }
*/
    // call users beforeRequest if specified
    if (typeof settings.beforeRequestHandler === 'function') {
        settings.beforeRequestHandler(req, function ( ) {
            request(req, function (err, res, body) {

                if (err || ~~(res.statusCode / 100) !== 2){
                    console.log(body);
                    settings.callback(err || res.body);
                } else {
                    if(body) {
                        settings.callback(null, JSON.parse(body));
                    } else {
                        settings.callback();
                    }                }
            });
        });
    } else {
        request(req, function (err, res, body) {
            if (err || res.statusCode !== 200){
                settings.callback(err || res.statusCode);
            } else {
                settings.callback(null, JSON.parse(body));
            }
        });
    }
};

module.exports = odata;
//$.odataUri = odataUri;
