
(function(w){
    /*****************
     * TEALIUM SCOPE *
     *****************/

    w.teal = w.teal || {};
    // indivudal log variables, eg. overall, label, rule, attribute and enrichment
    teal.m = "";
    teal.ml = "";
    teal.mr = "";
    teal.ma = "";
    teal.me = "";

    /*********************
     * UTILITY FUNCTIONS *
     *********************/

    // rules array to object, with logic:id pairs
    teal.rulesArr2Obj = function (arr) {
        var rObj = {};
        for (var i = 0; i < arr.length; ++i)
            if (arr[i] !== undefined) rObj[(arr[i].get('logic'))] = arr[i].get('id');
        return rObj;
    }
    // string to first letter capitalisation
    teal.upperCaseFirstLetter = function (string) {
        if (string) string = string.toLowerCase(); else string = "";
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    // string to title case
    teal.strToTitleCase = function (str) {
        var exclusions = ["ID", "AOV", "PDP", "CR"];
        return str.replace(/\w\S*/g, function (txt) {
            return (exclusions.indexOf(txt.toUpperCase()) != -1) ? txt.toUpperCase() : txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();    
        });
    }
    // label array to label object with name:id pairs
    teal.labelsArr2Obj = function (arr) {
        var rObj = {};
        for (var i = 0; i < arr.length; ++i)
            if (arr[i] !== undefined) rObj[teal.strToTitleCase(arr[i].get('name'))] = arr[i].get('id');
        return rObj;
    }
    // get transformation type, eg. set number, set string etc.
    teal.getTransType = function (type) {
        // unify type input to enable consistent matching
        tt = type ? type.replace(/\s/g, '').toLowerCase().trim() : "";
        // transformation details object
        var transType = {
            "badge": [1, "Assign Badge", "", "", ""],
            "boolean": [4, "Set Boolean", "", "", ""],
            "string": [6, "Set String", "SetProperty", "propertyQuantifier", "propertyValue"],
            "tally": [7, "Increment Tally", "", "", ""],
            "funnel": [8, "Update Funnel", "", "", ""],
            "setofstrings": [9, "Add To Set Of Strings", "", "", ""],
            "timeline": [10, "Update Timeline", "", "", ""],
            "number": [15, "Set Number", "SetMetric", "quantifier", "metricValue"],
            "date": [17, "Set Date", "", "", ""],
            "visitorid": [18, "Set Visitor Id", "", "", ""]
        };
        return transType[tt] ? transType[tt] : [];
    }
    // check if transformation already exists for attribute
    teal.isTransAssigned = function (tr, ty, ea, va) {
        var ex = false, // exists? = false
            trans = tr || [], // transformations array
            type = teal.getTransType(ty)[1] || "", // transformation type to check against
            test1 = type + "|" + ea + "|" + va;
        for (var i = 0, len = trans.length; i < len; i++) {
            var t = gApp.inMemoryModels.transformationCollection.get(trans[i]);
            var test2 = [];
            switch (t.get('name')) {
            case "Set Number":
                test2 = ["Set Number"];
                test2.push(t.get('action').get('metricValue').get('name')); // event attribute
                test2.push(t.get('action').get('quantifier').get('name')); // visitor attribute
                test2 = test2.join("|");
                break;
            case "Set String":
                test2 = ["Set String"];
                test2.push(t.get('action').get('propertyValue').get('name')); // event attribute
                test2.push(t.get('action').get('propertyQuantifier').get('name')); // visitor attribute
                test2 = test2.join("|");
                break;
            }
            if (test1 === test2) {
                ex = true;
            }
        }
        return ex;
    }
    // get attribute scope, eg. visit or visitor
    teal.getAttributeScope = function (scope) {
        // unify scope input to enable consistent matching
        s = scope ? scope.replace(/\s/g, '').toLowerCase().trim() : "";
        // data scope
        var dataScope = {"visit":{"value":"Current Visit","displayName":"visit","icon":"icon_visit_attr","prefix":"current_visit.","sort":2},"visitor":{"value":"Visitor","displayName":"visitor","icon":"icon_visitor_attr","prefix":"","sort":1}}
        return dataScope[s] ? dataScope[s] : {};
    }
    // return attribute type object
    teal.getAttributeType = function (type) {
        // unify type input to enable consistent matching
        t = type ? type.replace(/\s/g, '').toLowerCase().trim() : "";
        // data types object
        var dataType = {"badge":{"value":"visitor_badge","displayName":"badge","description":"Badges are ways of identifying segments of users (ex: Frequent_Visitor)","prefix":"badges.","icon":"fa-shield","color":"#7E4FC4","view":"QuantifierBadgeView","viewLabel":"badge","perspectiveType":"badges","scope":["Visitor"],"details":{"description":"Captures a special milestone or state of the visitor","example":"&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;vip&lt;&#x2F;span&gt;: true &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;","useCase":[{"name":"VIP"},{"name":"Window Shopper"},{"name":"Cart Abandoner"},{"name":"Active Shopper"},{"name":"Frequent Visitor"}]}},"number":{"value":"visitor_metric","displayName":"number","description":"Stores numerical data (ex: Return_Visit_Count)","prefix":"metrics.","icon":"fa-bar-chart","color":"#405BBF","scope":["Event","Visitor","Current Visit"],"perspectiveType":"metric","details":{"description":"Stores a numeric value","example":"&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;lifetime_total_value&lt;&#x2F;span&gt;: 100 &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;","useCase":[{"name":"Total Cart Value"},{"name":"Number of Purchases Made"}]}},"string":{"value":"visitor_property","displayName":"string","description":"Stores string properties. (ex: Favorite_product)","prefix":"properties.","icon":"fa-quote-right","color":"#9F3AAA","perspectiveType":"property","scope":["Event","Visitor","Current Visit"],"details":{"description":"Stores a text value","example":"&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;last_product_viewed&lt;&#x2F;span&gt;: &quot;shoes&quot; &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;","useCase":[{"name":"Last Page Viewed"},{"name":"Last Product Purchased"}]}},"boolean":{"value":"visitor_flag","displayName":"boolean","description":"Stores true or false values (ex: Return_Visitor)","prefix":"flags.","icon":"fa-flag","color":"#674BC3","perspectiveType":"flag","scope":["Event","Visitor","Current Visit"],"details":{"description":"Stores a true or false value","example":"&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;has_purchased&lt;&#x2F;span&gt;: true &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;","useCase":[{"name":"Has Added Items to Cart"},{"name":"Has Viewed Item"}]}},"date":{"value":"visitor_date","displayName":"date","description":"Stores a date value (ex: Feb 18, 1982 10:34am)","prefix":"dates.","icon":"fa-calendar","color":"#B2305B","perspectiveType":"date","scope":["Visitor","Current Visit"],"details":{"description":"Stores a date (in milli-seconds)","example":"&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;last_checkout_date&lt;&#x2F;span&gt;: 1458578676733 &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;","useCase":[{"name":"Last Checkout Date"},{"name":"Last Visited Date"}]}},"tally":{"value":"visitor_metric_set","displayName":"tally","description":"Stores a set of numbers","prefix":"metric_sets.","icon":"fa-list","color":"#BB6C3E","perspectiveType":"metric_set","scope":["Visitor","Current Visit"],"details":{"description":"Stores a list of key value pairs where the values are numbers. (This attribute also generates a favorite attribute that captures the item in this list that holds the highest number value)","example":"&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;browsers_used&lt;&#x2F;span&gt;: {Chrome : 10, FireFox : 5, Safari : 2} &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;","useCase":[{"name":"Product Categories Viewed"},{"name":"Pages Viewed"},{"name":"Products Purchased"}]}},"setofstrings":{"value":"visitor_property_set","displayName":"Set of Strings","description":"Stores a unique set of strings","prefix":"property_sets.","icon":"fa-align-left","color":"#39AC82","perspectiveType":"property_set","scope":["Visitor","Current Visit"],"details":{"description":"Stores a collection of unique text values","example":"&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;product_categories&lt;&#x2F;span&gt;: [&quot;shirts&quot;, &quot;shoes&quot;, &quot;hats&quot;] &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;","useCase":[{"name":"Product Categories Viewed"},{"name":"Pages Viewed"},{"name":"Products Purchased"}]}},"funnel":{"value":"funnel","displayName":"funnel","description":"Stores a predefined ordered list of events. (ex: Payment Funnel)","prefix":"funnels.","icon":"fa-filter","color":"#5785C7","transformationButtonLabel":"Create A Step","transformationSectionLabel":"steps","transformationSectionEmptyLabel":"Create A New Step","perspectiveType":"funnel","scope":["Visitor","Current Visit"],"details":{"description":"Stores an ordered list of milestones","example":"NA","useCase":[{"name":"Checkout Funnel"},{"name":"Purchase Funnel"},{"name":"Lead Gen Funnel"}]}},"timeline":{"value":"sequence","displayName":"timeline","description":"Stores an ordered list of events.","prefix":"sequences.","icon":"fa-ellipsis-h","color":"#C34D4B","transformationButtonLabel":"Create An Entry","transformationSectionLabel":"entries","transformationSectionEmptyLabel":"Create A New Entry","perspectiveType":"sequence","scope":["Visitor","Current Visit"],"details":{"description":"Stores an ordered list of events","example":"NA","useCase":[{"name":"Product Views"},{"name":"Product Purchases"}]}},"visitorid":{"value":"secondary_id","displayName":"Visitor ID","description":"Stores a value that is used to identify a visitor","prefix":"secondary_ids.","icon":"fa-user","color":"#915130","perspectiveType":"secondary_id","scope":["Visitor"],"details":{"description":"Stores a unique identifier for the visitor","example":"&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;rewards_member_id&lt;&#x2F;span&gt;: 123456789 &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;","useCase":[{"name":"Stitching Multiple Visitor Profiles Together"}]}}}
        return dataType[t] ? dataType[t] : {};
    }
    // get attribute type id
    teal.getAttributeTypeId = function (typeid) {
        // unify scope input to enable consistent matching
        tid = typeid ? typeid.replace(/\s/g, '').toLowerCase().trim() : "";
        // data type id
        var dataTypeId = {"badge":"badges","number":"metrics","string":"properties","boolean":"flags","date":"dates","tally":"metric_sets","setofstrings":"property_sets","funnel":"funnels","timeline":"sequences","visitorid":"secondary_ids"}
        return dataTypeId[tid] ? dataTypeId[tid] : "";
    }
    // get badge data object
    teal.getBadgeData = function () {
        return new gApp.models.Badge({
            "id": 0,
            "icon": "pictonic icon-shield-lines",
            "label": "",
            "color": "indigo",
            "brightness": "light",
            "selected": false,
            "num": 0
        });
    }

    /***************************
     * CONFIGURATION FUNCTIONS *
     ***************************/

    // get label ids (create label if it doesn't exist)
    teal.getLabelIds = function (labels) {
        var li = []; // label ids array
        var ln = []; // label names array
        var lo = {}; // existing labels object
        var lc = ["red", "orange", "green", "blue", "violet", "purple"]; // available label colors
        // split, trim and title case label names 
        if (labels) ln = labels.split(",").map(function (item) {
            return teal.strToTitleCase(item.trim());
        });
        // create obj from existing labels array, with name as key and id as value
        lo = teal.labelsArr2Obj(gApp.inMemoryModels.labelCollection.models);
        // loop over label name array
        for (var i = 0, len = ln.length; i < len; i++) {
            // check if label names that were passed already exist and get id
            if (lo[ln[i]] !== undefined) {
                // add label to the lable ids array
                li.push(lo[ln[i]]);
            } else {
                if (ln[i] !== "") {
                    // create new label with the given features and add to labelCollection object
                    var label = gApp.inMemoryModels.labelCollection.add(new gApp.models.Label({
                        "color": lc[Math.floor(Math.random() * lc.length)], // pick random color from color array
                        "name": ln[i]
                    }));
                    // add label to the lblIds for the attribute or rule
                    li.push(label.id);
                    // add to log message
                    teal.ml += '<li><span style="color:green">Created Label: "' + label.get('name') + '"</span></li>';
                }
            }
        }
        // return the array with the label ids
        return li;
    }
    // create rule for event attribute
    teal.addRule = function (dataset) {
        var ds = dataset || {};
        try {
            // create new rule for IS ASSIGNED AND NOT EMPTY for the event atttribute we're enriching the Visitor-level attribute with
            var eventAttr = gApp.utils.quantifier.getQuantifierByName(ds.ea_title);
            if (eventAttr) {
                // fully qualified id of event attribute, to check if rule exists
                var fullyQualId = eventAttr.getFullyQualifiedId();
                // build logic off of assigned and not empty for event attribute to test for existing rule
                var ruleLogic = "{\"$or\":[{\"$and\":[{\"baseOperator\":null,\"operator\":\"exists\",\"operand1\":\"" + fullyQualId + "\",\"operand2\":0},{\"baseOperator\":null,\"operator\":\"is_not_empty\",\"operand1\":\"" + fullyQualId + "\",\"operand2\":0}]}]}";
                // build object from all existing rules logic component for comparison
                var rObj = teal.rulesArr2Obj(gApp.inMemoryModels.ruleCollection.models);
                // check if rule exists based on logic and create it if NOT
                if (rObj[ruleLogic] === undefined) {
                    var rule = new gApp.models.Rule({
                        "id": gApp.utils.rule.getNextUniqueRuleId(),
                        "name": ds.ea_title + " is assigned and not empty",
                        "description": (ds.ea_source ? 'Data Source: ' + ds.ea_source : ""),
                        "labelIds": (ds.va_label ? teal.getLabelIds(ds.va_label) : []),
                        "editable": true,
                    })
                    // create selectors for condition
                    var condSelectors = [new gApp.models.QuerySelector({
                        "baseOperator": null,
                        "operator": "exists",
                        "operand1": fullyQualId,
                        "operand2": ""
                    }), new gApp.models.QuerySelector({
                        "baseOperator": null,
                        "operator": "is_not_empty",
                        "operand1": fullyQualId,
                        "operand2": ""
                    })];
                    // add rule to UI
                    var r = gApp.inMemoryModels.ruleCollection.add(rule);
                    // push selectors into conditions object with the rule
                    var s = r.attributes.conditions.attributes.selectors;
                    s.push(new gApp.models.LogicalSelector({
                        logicalOperator: "$and",
                        selectors: condSelectors
                    }));
                    // add logic string to rule attributes by stringifying the conditions of the newly created rule
                    gApp.inMemoryModels.ruleCollection.get(r.get('id')).attributes.logic = JSON.stringify(gApp.inMemoryModels.ruleCollection.get(r.get('id')).attributes.conditions);
                    // add to log message
                    teal.mr += '<li><span style="color:green">Created rule "' + r.get('name') + '" (' + r.get('id') + ')</span></li>';
                } else {
                    // add to log message
                    //teal.m += '<li><span style="color:orange">Skipped Rule: "' + d.ea_title + ' is assigned and not empty" (' + gApp.utils.rule.getRuleByName(d.ea_title + ' is assigned and not empty').get('id') + ')</span></li>';
                }
            } else {
                // add to log message
                teal.mr += '<li><span style="color:red">Failed to create rule, because event attribute "' + ds.ea_title + '" does not exist</span></li>';
            }
        } catch (e) {
            // add to log message
            teal.mr += '<li><span style="color:red">Failed to create rule "' + ds.ea_title + ' is assigned and not empty"<br>Error: ' + e + '</span></li>';
        }
        // return rule object
        return r;
    }
    // add basic enrichent for tealium attribute off of event attribute
    teal.addEnrichment = function (dataset) {
        var ds = dataset || {},
            trans = gApp.utils.quantifier.getQuantifierByName(ds.va_title).get('transformationIds') || [],
            type = ds.va_type ? ds.va_type.replace(/\s/g, '').toLowerCase().trim() : "",
            trigger = 3, // any event
            ruleName = ds.ea_title + ' is assigned and not empty',
            ruleId = gApp.utils.rule.getRuleByName(ruleName) ? gApp.utils.rule.getRuleByName(ruleName).get('id') : [],
            tid = gApp.utils.quantifier.getQuantifierByName(ds.va_title) ? gApp.utils.quantifier.getQuantifierByName(ds.va_title).get('id') : 0,
            did = gApp.utils.quantifier.getQuantifierByName(ds.ea_title) ? gApp.utils.quantifier.getQuantifierByName(ds.ea_title).get('id') : 0,
            lbl = ds.va_label || "",
            tto = gApp.inMemoryModels.transformationTypeCollection.get(teal.getTransType(type)[0]).attributes, // trans type object
            qc = gApp.inMemoryModels.quantifierCollection, // quantifier collection
            allowedDataTypes = ["number", "string", "boolean"];
        if (type != "" && allowedDataTypes.indexOf(type) != -1) {
            if (!teal.isTransAssigned(trans, type, ds.ea_title, ds.va_title)) {
                if (tid && did && trigger) {
                    try {
                        // build transformation object
                        var tObj = {
                            "createdByPlay": [],
                            "id": gApp.utils.transformation.getNextUniqueTransformationId(),
                            "name": teal.getTransType(type)[1],
                            "description": "",
                            "trigger": new gApp.models.Trigger(gApp.inMemoryModels.triggerCollection.get(trigger).attributes),
                            "type": new gApp.models.TransformationType(tto),
                            "hidden": false,
                            "editable": true,
                            "preloaded": false,
                            "rules": [ruleId],
                            "orderIndex": gApp.utils.transformation.nextTransformationOrderIndex(),
                            "labelIds": teal.getLabelIds(lbl),
                        };
                        switch (type) {
                        case "string":
                            tObj.action = new gApp.models['Transformation' + teal.getTransType(type)[2]]({
                                "propertyQuantifier": qc.get(tid),
                                "propertyValue": qc.get(did)
                            });
                            tObj.actionData = {
                                "propertyQuantifierId": tid,
                                "propertyValue": qc.get(did).getFullyQualifiedId()
                            };
                            break;
                        case "boolean":
                            tObj.action = new gApp.models['Transformation' + teal.getTransType(type)[2]]({
                                "quantifier": qc.get(tid),
                                "value": true
                            });
                            break;
                        case "number":
                            tObj.action = new gApp.models['Transformation' + teal.getTransType(type)[2]]({
                                "metricValue": qc.get(did),
                                "quantifier": qc.get(tid)
                            });
                            break;
                        }

                        // create new transformation and add to gApp and UI
                        var t = gApp.inMemoryModels.transformationCollection.add(new gApp.models.Transformation(tObj));
                        // add enrichment id to the enrichment array
                        trans.push(t.get('id'));
                        // add enrichment from event attribute to visitor attribute
                        gApp.inMemoryModels.quantifierCollection.get(tid).attributes.transformationIds = trans;
                        // add enrichment name and id to change log
                        teal.me += '<li><span style="color:green">Created "' + teal.getTransType(type)[1] + '" enrichment for "' + ds.va_title + '" (' + t.get('id') + ')</span></li>';
                    } catch (e) {
                        teal.me += '<li><span style="color:red">Failed enrichment "' + teal.getTransType(type)[1] + '" for "' + ds.va_title + '"<br>Error: ' + e + '</span></li>';
                    }
                } else {
                    teal.me += '<li><span style="color:red">Failed enrichment "' + teal.getTransType(type)[1] + '" for "' + ds.va_title + '"<br>Error: Missing Variables</span></li>';
                }
            } else {
                //teal.m += '<li><span style="color:white">Enrichment: "' + teal.getTransType(type)[1] + '" from "' + d.ea_title + '" for "' + d.va_title + '"<br>already exists</span></li>';
            }
        } else {
            teal.me += '<li><span style="color:red">Failed enrichment "' + teal.getTransType(type)[1] + '" for "' + ds.va_title + '"<br>Error: Unsupported Data Type - "' + teal.upperCaseFirstLetter(ds.va_type) + '"</span></li>';
        }
        return trans;
    }
    // add attribute to udh including rule, labels and simple enrichment
    teal.addAttribute = function (data) {
        var a = {};
        var d = data || [];
        var attr = {};
        var ts = "";
        var te = "";
        teal.m = "<h2>Change Log</h2>";
        teal.ml = "<h3>Labels</h3><ol>";
        teal.ma = "<h3>Visitor/Visit Attributes</h3><ol>";
        teal.mr = "<h3>Rules</h3><ol>";
        teal.me = "<h3>Enrichments</h3><ol>";
        try {
            // time process started
            ts = new Date();
            // loop over data set and create individual rules and attributes
            for (var i = 0, len = d.length; i < len; i++) {
                // individual data set
                var ds = {};
                ds.va_scope = d[i].va_scope ? d[i].va_scope.trim().toLowerCase() : "";
                ds.va_type = d[i].va_type ? d[i].va_type.trim().toLowerCase() : "";
                ds.va_title = d[i].va_title ? teal.strToTitleCase(d[i].va_title.trim()) : "";
                ds.va_note = d[i].va_note ? teal.upperCaseFirstLetter(d[i].va_note.trim()) : "";
                ds.va_label = d[i].va_label ? d[i].va_label : "";
                ds.ea_title = d[i].ea_title ? d[i].ea_title.trim() : "";
                ds.ea_source = d[i].ea_source ? teal.upperCaseFirstLetter(d[i].ea_source.trim()) : "";
                // new quantifier object via Quantifier constructor method
                if (gApp.utils.quantifier.getQuantifierByName(ds.va_title)) {
                    a = gApp.utils.quantifier.getQuantifierByName(ds.va_title);
                } else {
                    // create attribute object used to create NEW quantifier
                    attr = {
                        "id": gApp.utils.quantifier.getNextUniqueQuantifierId(),
                        "name": ds.va_title,
                        "description": ds.va_note,
                        "type": teal.getAttributeType(ds.va_type),
                        "context": teal.getAttributeScope(ds.va_scope),
                        "hidden": false,
                        "editable": true,
                        "preloaded": false,
                        "refers": 0,
                        "labelIds": teal.getLabelIds(ds.va_label, ""),
                        "transformationIds": [],
                        "data": /(B|b)adge/.test(ds.va_type) ? teal.getBadgeData() : null,
                        "_previousAttributes": {
                            "id": 0,
                            "name": "",
                            "description": "",
                            "eventKey": "",
                            "type": teal.getAttributeType(ds.va_type),
                            "ea_sourceType": "",
                            "context": "",
                            "editable": false,
                            "hidden": false,
                            "preloaded": false,
                            "deleted": false,
                            "isPersonalInfo": false,
                            "transformationIds": [],
                            "classifications": [],
                            "refers": 0,
                            "data": null,
                            "config": {},
                            "eventDBEnabled": false,
                            "audienceDBEnabled": false,
                            "labelIds": [],
                            "createdByPlay": [],
                            "fullyQualifiedId": "undefined" + teal.getAttributeTypeId(ds.va_type) + ".0"
                        },
                        "eventKey": "",
                        "ea_sourceType": "",
                        "deleted": false,
                        "isPersonalInfo": false,
                        "classifications": [],
                        "config": {},
                        "eventDBEnabled": false,
                        "audienceDBEnabled": false,
                        "createdByPlay": [],
                        "fullyQualifiedId": teal.getAttributeTypeId(ds.va_type) + "." + gApp.utils.quantifier.getNextUniqueQuantifierId()
                    }
                    // adding new quantifier object to quantifier collections (add to UI)
                    a = gApp.inMemoryModels.quantifierCollection.add(new gApp.models.Quantifier(attr));
                    // add attribute name to change log
                    teal.ma += '<li><span style="color:green">Created "' + teal.strToTitleCase(ds.va_type) + '" attribute "' + a.get('name') + '" (' + a.get('id') + ')</span></li>';
                }
                // when event attribute is available create new rule/check for existing
                if (ds.ea_title !== "") var r = teal.addRule(ds);
                // when event attribute is available create enrichment for event attribute and add to visitor attribute
                if (gApp.utils.quantifier.getQuantifierByName(ds.ea_title) !== undefined) var t = teal.addEnrichment(ds);
            }
            // time process finished
            te = new Date();
            teal.ml += "</ol>";
            teal.ma += "</ol>";
            teal.mr += "</ol>";
            teal.me += "</ol>";
            teal.m += teal.ml;
            teal.m += teal.ma;
            teal.m += teal.mr;
            teal.m += teal.me;
            // add total processing time to change log
            teal.m += '<p>Total Time: ' + ((te - ts) / 1000) + 'sec</p>';
            // Pop up message with result after script ran
            gApp.utils.modal.show(new gApp.views.SimpleModalView({
                model: new Backbone.Model({
                    title: "Attribute Configuration Successful!",
                    message: teal.m
                })
            }))
        } catch (e) {
            gApp.utils.modal.show(new gApp.views.SimpleModalView({
                model: new Backbone.Model({
                    title: "Attribute Configuration Failed!",
                    message: "<span style='color:red'>Attribute Configuration Failed - Do Not Save/Publish.<br>Error Message: " + e.message + "</span>"
                })
            }))
        }
    }    
})(window)
