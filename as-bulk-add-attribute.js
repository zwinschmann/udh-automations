window.teal = window.teal || {};
teal.m = teal.m || "";
// Array to Object
teal.rulesArr2Obj = function (arr) {
    var rObj = {};
    for (var i = 0; i < arr.length; ++i)
        if (arr[i] !== undefined) rObj[(arr[i].get('logic'))] = arr[i].get('id');
    return rObj;
}
// create rule for tealium event-level attribute
teal.createRule = function (data) {
    var d = data || {};
    try {
        // create new rule for IS ASSIGNED for the event atttribute we're building the Visitor-level attribute from
        var eventAttrId = gApp.utils.quantifier.getQuantifierByName(d.dataSourceAttr).get('id');
        // fully qualified id from event attri to check if rule exists
        var fullyQualId = gApp.inMemoryModels.quantifierCollection.get(eventAttrId).attributes.fullyQualifiedId;
        // build logic off of assigned and not empty for event attribute to test for existing rule
        var ruleLogic = "{\"$or\":[{\"$and\":[{\"baseOperator\":null,\"operator\":\"exists\",\"operand1\":\""+fullyQualId+"\",\"operand2\":0},{\"baseOperator\":null,\"operator\":\"is_not_empty\",\"operand1\":\""+fullyQualId+"\",\"operand2\":0}]}]}";
        // build object from all existing rules logic component for comparison
        var rObj = teal.rulesArr2Obj(gApp.inMemoryModels.ruleCollection.models);
        // check if rule exists based on logic and create it if NOT
        if (rObj[ruleLogic] === undefined) {
            var rule = new gApp.models.Rule({
                "id": gApp.utils.rule.getNextUniqueRuleId(),
                "name": d.dataSourceAttr + " is assigned and not empty",
                "description": 'Data Source: ' + d.dataSource + ' - ' + d.dataSourceEvent,
                "labelIds": (d.tealAttrLabels ? teal.getLabelIds(d.tealAttrLabels, "") : []),
                "editable": true,
            })
            // create selectors for condition
            var condSelectors = [new gApp.models.QuerySelector({
                "baseOperator": null,
                "operator": "exists",
                "operand1": gApp.inMemoryModels.quantifierCollection.get(eventAttrId).attributes.fullyQualifiedId,
                "operand2": ""
            }), new gApp.models.QuerySelector({
                "baseOperator": null,
                "operator": "is_not_empty",
                "operand1": gApp.inMemoryModels.quantifierCollection.get(eventAttrId).attributes.fullyQualifiedId,
                "operand2": ""
            })];
            // add rule to UI
            var r = gApp.inMemoryModels.ruleCollection.add(rule);
            // push selectors into conditions object with the rule
            var s = gApp.inMemoryModels.ruleCollection.get(r.get('id')).attributes.conditions.attributes.selectors;
            s.push(new gApp.models.LogicalSelector({
                logicalOperator: "$and",
                selectors: condSelectors
            }));
            // add logic string to rule attributes by stringifying the conditions of the newly created rule
            gApp.inMemoryModels.ruleCollection.get(r.get('id')).attributes.logic = JSON.stringify(gApp.inMemoryModels.ruleCollection.get(r.get('id')).attributes.conditions);
            // add to log message
            teal.m += '<li><span style="color:green">Created Rule: <b>"' + r.get('name') + '"</b> (' + r.get('id') + ')</span></li>';
        } else {
            teal.m += '<li><span style="color:orange">Skipped Rule: <b>"' + d.dataSourceAttr + ' is assigned and empty"</b> (' + gApp.utils.rule.getRuleByName(d.dataSourceAttr+' is assigned and not empty').get('id') + ')</span></li>';
        }
    } catch (e) {
        // add to log message
        teal.m += '<li><span style="color:red">Failed to Create Rule <b>"' + d.dataSourceAttr + ' is assigned and empty"</b><br>Error: ' + e + '</span></i>';
    }
    // return rule object
    return r;
}
// String to Title Case
teal.strToTitleCase = function (str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
// Array to Object
teal.labelsArr2Obj = function (arr) {
    var rObj = {};
    for (var i = 0; i < arr.length; ++i)
        if (arr[i] !== undefined) rObj[teal.strToTitleCase(arr[i].attributes.name)] = arr[i].attributes.id;
    return rObj;
}
// get label ids (create label if it doesn't exist)
teal.getLabelIds = function (names) {
    var lblIds = [],
        lblNames = names || "",
        lblCols = ["red", "orange", "green", "blue", "violet", "purple"];
    // split labels names
    lblNames = lblNames.split(",") || [];
    // create obj from existing labels array                          name as key and id as value
    var exLblObj = teal.labelsArr2Obj(gApp.inMemoryModels.labelCollection.models) || {};
    for (var i = 0, len = lblNames.length; i < len; i++) {
        // check if label names that were passed already exist and get id
        if (exLblObj[teal.strToTitleCase(lblNames[i]).trim()] !== undefined) {
            // add label to the lblIds for the attribute or rule
            lblIds.push(exLblObj[lblNames[i]]);
            // add to log message
            teal.m += '<li><span style="color:orange">Label <b>"' + teal.strToTitleCase(lblNames[i]).trim() + '"</b> already exists</span></li>';
        } else {
            if (teal.strToTitleCase(lblNames[i]).trim() !== "") {
                // Create new label with the given features and add to labelCollection object
                var label = gApp.inMemoryModels.labelCollection.add(new gApp.models.Label({
                    "color": lblCols[Math.floor(Math.random() * lblCols.length)],
                    "name": teal.strToTitleCase(lblNames[i].trim())
                }));
                // add label to the lblIds for the attribute or rule
                lblIds.push(label.id);
                // add to log message
                teal.m += '<li><span style="color:green">Created Label: <b>"' + label.get('name') + '"</b></span></li>';
            }
        }
    }
    // return the array with the label ids
    return lblIds;
}
// get transformation type
teal.getTransType = function (type) {
    // unify type input to enable consistent matching
    tt = type ? type.replace(/\s/g,'').toLowerCase().trim() : "";
    // transformation details object
    var transType = {
        "badge": [1, "Assign Badge", "", "", ""],
        "number": [15, "Set Number", "SetMetric", "quantifier", "metricValue"],
        "string": [6, "Set String", "SetProperty", "propertyQuantifier", "propertyValue"],
        "boolean": [4, "Set Boolean", "", "", ""],
        "date": [17, "Set Date", "", "", ""],
        "tally": [7, "Increment Tally", "", "", ""],
        "setofstrings": [9, "Add To Set Of Strings", "", "", ""],
        "funnel": [8, "Update Funnel", "", "", ""],
        "timeline": [10, "Update Timeline", "", "", ""],
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
// add basic enrichent for tealium attribute off of event attribute
teal.createEnrichment = function (data) {
    var d = data || {},
        trans = gApp.utils.quantifier.getQuantifierByName(d.tealAttrName).get('transformationIds') || [],
        type = d.tealAttrType ? d.tealAttrType.replace(/\s/g, '').toLowerCase().trim() : "",
        trigger = 3, // any event
        ruleName = d.dataSourceAttr + ' is assigned and not empty',
        ruleId = gApp.utils.rule.getRuleByName(ruleName) ? gApp.utils.rule.getRuleByName(ruleName).get('id') : [],
        tid = d.tealAttrName ? gApp.utils.quantifier.getQuantifierByName(d.tealAttrName).get('id') : 0,
        did = d.dataSourceAttr ? gApp.utils.quantifier.getQuantifierByName(d.dataSourceAttr).get('id') : 0,
        lbl = d.tealAttrLabels || "",
        tto = gApp.inMemoryModels.transformationTypeCollection.get(teal.getTransType(type)[0]).attributes, // trans type object
        qc = gApp.inMemoryModels.quantifierCollection, // quantifier collection
        allowedDataTypes = ["number", "string"];
    if (type != "" && allowedDataTypes.indexOf(type) != -1) {
        if (!teal.isTransAssigned(trans, type, d.dataSourceAttr, d.tealAttrName)) {
            if (tid && did && trigger) {
                try {
                    // build transformation object
                    var tObj = {
                        "description": "",
                        "editable": true,
                        "id": gApp.utils.transformation.getNextUniqueTransformationId(),
                        "name": teal.getTransType(type)[1],
                        "orderIndex": gApp.utils.transformation.nextTransformationOrderIndex(),
                        "preloaded": false,
                        "trigger": new gApp.models.Trigger(gApp.inMemoryModels.triggerCollection.get(trigger).attributes),
                        "hidden": false,
                        "rules": [ruleId],
                        "labelIds": teal.getLabelIds(lbl),
                        "createdByPlay": [],
                        "type": new gApp.models.TransformationType(tto),
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
                    teal.m += '<li><span style="color:green">Created "' + teal.getTransType(type)[1] + '" Enrichment for: <b>"' + d.tealAttrName + '"</b> (' + t.get('id') + ')</span></li>';
                } catch (e) {
                    teal.m += '<li><span style="color:red">Failed Enrichment: <b>"' + teal.getTransType(type)[1] + '"</b> for <b>"' + d.tealAttrName + '"</b><br>Error: ' + e + '</span></li>';
                }
            } else {
                teal.m += '<li><span style="color:red">Failed Enrichment: <b>"' + teal.getTransType(type)[1] + '"</b> for <b>"' + d.tealAttrName + '"</b><br>Error: Missing Variables</span></li>';
            }
        } else {
            teal.m += '<li><span style="color:orange">Enrichment: <b>"' + teal.getTransType(type)[1] + '"</b> from <b>"' + d.dataSourceAttr + '"</b> for <b>"' + d.tealAttrName + '"</b><br>already exists</span></li>';
        }
    } else {
        teal.m += '<li><span style="color:red">Failed Enrichment: <b>"' + teal.getTransType(type)[1] + '"</b> for <b>"' + d.tealAttrName + '"</b><br>Error: Wrong Data Type</span></li>';
    }
    return trans;
}
// return attribute type object
teal.getAttributeType = function(type) {
    // unify type input to enable consistent matching
    t = type ? type.replace(/\s/g,'').toLowerCase().trim() : "";
    // data types object
    var dataType = {
        "badge": {
            "value": "visitor_badge",
            "displayName": "badge",
            "description": "Badges are ways of identifying segments of users (ex: Frequent_Visitor)",
            "prefix": "badges.",
            "icon": "fa-shield",
            "color": "#7E4FC4",
            "view": "QuantifierBadgeView",
            "viewLabel": "badge",
            "perspectiveType": "badges",
            "scope": ["Visitor"],
            "details": {
                "description": "Captures a special milestone or state of the visitor",
                "example": "&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;vip&lt;&#x2F;span&gt;: true &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;",
                "useCase": [{
                    "name": "VIP"
                }, {
                    "name": "Window Shopper"
                }, {
                    "name": "Cart Abandoner"
                }, {
                    "name": "Active Shopper"
                }, {
                    "name": "Frequent Visitor"
                }]
            }
        },
        "number": {
            "value": "visitor_metric",
            "displayName": "number",
            "description": "Stores numerical data (ex: Return_Visit_Count)",
            "prefix": "metrics.",
            "icon": "fa-bar-chart",
            "color": "#405BBF",
            "scope": ["Event", "Visitor", "Current Visit"],
            "perspectiveType": "metric",
            "details": {
                "description": "Stores a numeric value",
                "example": "&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;lifetime_total_value&lt;&#x2F;span&gt;: 100 &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;",
                "useCase": [{
                    "name": "Total Cart Value"
                }, {
                    "name": "Number of Purchases Made"
                }]
            }
        },
        "string": {
            "value": "visitor_property",
            "displayName": "string",
            "description": "Stores string properties. (ex: Favorite_product)",
            "prefix": "properties.",
            "icon": "fa-quote-right",
            "color": "#9F3AAA",
            "perspectiveType": "property",
            "scope": ["Event", "Visitor", "Current Visit"],
            "details": {
                "description": "Stores a text value",
                "example": "&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;last_product_viewed&lt;&#x2F;span&gt;: &quot;shoes&quot; &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;",
                "useCase": [{
                    "name": "Last Page Viewed"
                }, {
                    "name": "Last Product Purchased"
                }]
            }
        },
        "boolean": {
            "value": "visitor_flag",
            "displayName": "boolean",
            "description": "Stores true or false values (ex: Return_Visitor)",
            "prefix": "flags.",
            "icon": "fa-flag",
            "color": "#674BC3",
            "perspectiveType": "flag",
            "scope": ["Event", "Visitor", "Current Visit"],
            "details": {
                "description": "Stores a true or false value",
                "example": "&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;has_purchased&lt;&#x2F;span&gt;: true &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;",
                "useCase": [{
                    "name": "Has Added Items to Cart"
                }, {
                    "name": "Has Viewed Item"
                }]
            }
        },
        "date": {
            "value": "visitor_date",
            "displayName": "date",
            "description": "Stores a date value (ex: Feb 18, 1982 10:34am)",
            "prefix": "dates.",
            "icon": "fa-calendar",
            "color": "#B2305B",
            "perspectiveType": "date",
            "scope": ["Visitor", "Current Visit"],
            "details": {
                "description": "Stores a date (in milli-seconds)",
                "example": "&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;last_checkout_date&lt;&#x2F;span&gt;: 1458578676733 &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;",
                "useCase": [{
                    "name": "Last Checkout Date"
                }, {
                    "name": "Last Visited Date"
                }]
            }
        },
        "tally": {
            "value": "visitor_metric_set",
            "displayName": "tally",
            "description": "Stores a set of numbers",
            "prefix": "metric_sets.",
            "icon": "fa-list",
            "color": "#BB6C3E",
            "perspectiveType": "metric_set",
            "scope": ["Visitor", "Current Visit"],
            "details": {
                "description": "Stores a list of key value pairs where the values are numbers. (This attribute also generates a favorite attribute that captures the item in this list that holds the highest number value)",
                "example": "&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;browsers_used&lt;&#x2F;span&gt;: {Chrome : 10, FireFox : 5, Safari : 2} &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;",
                "useCase": [{
                    "name": "Product Categories Viewed"
                }, {
                    "name": "Pages Viewed"
                }, {
                    "name": "Products Purchased"
                }]
            }
        },
        "setofstrings": {
            "value": "visitor_property_set",
            "displayName": "Set of Strings",
            "description": "Stores a unique set of strings",
            "prefix": "property_sets.",
            "icon": "fa-align-left",
            "color": "#39AC82",
            "perspectiveType": "property_set",
            "scope": ["Visitor", "Current Visit"],
            "details": {
                "description": "Stores a collection of unique text values",
                "example": "&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;product_categories&lt;&#x2F;span&gt;: [&quot;shirts&quot;, &quot;shoes&quot;, &quot;hats&quot;] &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;",
                "useCase": [{
                    "name": "Product Categories Viewed"
                }, {
                    "name": "Pages Viewed"
                }, {
                    "name": "Products Purchased"
                }]
            }
        },
        "funnel": {
            "value": "funnel",
            "displayName": "funnel",
            "description": "Stores a predefined ordered list of events. (ex: Payment Funnel)",
            "prefix": "funnels.",
            "icon": "fa-filter",
            "color": "#5785C7",
            "transformationButtonLabel": "Create A Step",
            "transformationSectionLabel": "steps",
            "transformationSectionEmptyLabel": "Create A New Step",
            "perspectiveType": "funnel",
            "scope": ["Visitor", "Current Visit"],
            "details": {
                "description": "Stores an ordered list of milestones",
                "example": "NA",
                "useCase": [{
                    "name": "Checkout Funnel"
                }, {
                    "name": "Purchase Funnel"
                }, {
                    "name": "Lead Gen Funnel"
                }]
            }
        },
        "timeline": {
            "value": "sequence",
            "displayName": "timeline",
            "description": "Stores an ordered list of events.",
            "prefix": "sequences.",
            "icon": "fa-ellipsis-h",
            "color": "#C34D4B",
            "transformationButtonLabel": "Create An Entry",
            "transformationSectionLabel": "entries",
            "transformationSectionEmptyLabel": "Create A New Entry",
            "perspectiveType": "sequence",
            "scope": ["Visitor", "Current Visit"],
            "details": {
                "description": "Stores an ordered list of events",
                "example": "NA",
                "useCase": [{
                    "name": "Product Views"
                }, {
                    "name": "Product Purchases"
                }]
            }
        },
        "visitorid": {
            "value": "secondary_id",
            "displayName": "Visitor ID",
            "description": "Stores a value that is used to identify a visitor",
            "prefix": "secondary_ids.",
            "icon": "fa-user",
            "color": "#915130",
            "perspectiveType": "secondary_id",
            "scope": ["Visitor"],
            "details": {
                "description": "Stores a unique identifier for the visitor",
                "example": "&lt;p class=&quot;fourtabs&quot;&gt;var datalayer = {&lt;br &#x2F;&gt;\t&lt;span class=&quot;solution&quot;&gt;rewards_member_id&lt;&#x2F;span&gt;: 123456789 &lt;br &#x2F;&gt;}&lt;&#x2F;p&gt;",
                "useCase": [{
                    "name": "Stitching Multiple Visitor Profiles Together"
                }]
            }
        }
    }
    return dataType[t] ? dataType[t] : {};
}
// get attribute scope
teal.getAttributeScope = function(scope) {
    // unify scope input to enable consistent matching
    s = scope ? scope.replace(/\s/g,'').toLowerCase().trim() : "";
    // data scope
    var dataScope = {
        "visit": {
            "value": "Current Visit",
            "displayName": "visit",
            "icon": "icon_visit_attr",
            "prefix": "current_visit.",
            "sort": 2
        },
        "visitor": {
            "value": "Visitor",
            "displayName": "visitor",
            "icon": "icon_visitor_attr",
            "prefix": "",
            "sort": 1
        }
    }
    return dataScope[s] ? dataScope[s] : {};
}
// get attribute type id
teal.getAttributeTypeId = function(typeid) {
    // unify scope input to enable consistent matching
    tid = typeid ? typeid.replace(/\s/g,'').toLowerCase().trim() : "";
    // data type id
    var dataTypeId = {
        "badge": "badges",
        "number": "metrics",
        "string": "properties",
        "boolean": "flags",
        "date": "dates",
        "tally": "metric_sets",
        "setofstrings": "property_sets",
        "funnel": "funnels",
        "timeline": "sequences",
        "visitorid": "secondary_ids"
    }
    return dataTypeId[tid] ? dataTypeId[tid] : "";
}
// add tealium attribute including rule, labels and simple enrichment
teal.configureAttribute = function (data) {
    var a = attr = {},
        d = data || {},
        ts = te = "";
    teal.m = "Change Log:<br><ol>";
    try {
        // time started
        ts = new Date();
        // loop over data set and create individual rules and attributes
        for (var i = 0, len = d.length; i < len; i++) {
            // create new rule for d[i].tealAttrName and add output to change log message
            var r = teal.createRule(d[i]);
            // new quantifier object via Quantifier constructor method
            if (gApp.utils.quantifier.getQuantifierByName(d[i].tealAttrName)) {
                a = gApp.utils.quantifier.getQuantifierByName(d[i].tealAttrName);
            } else {
                // create attribute object used to create NEW quantifier
                attr = {
                    "id": gApp.utils.quantifier.getNextUniqueQuantifierId(),
                    "name": d[i].tealAttrName,
                    "description": d[i].tealAttrName + ' (' + d[i].dataSource + ' - ' + d[i].dataSourceEvent + ')',
                    "type": teal.getAttributeType(d[i].tealAttrType),
                    "context": teal.getAttributeScope(d[i].tealAttrScope),
                    "hidden": false,
                    "editable": true,
                    "preloaded": false,
                    "refers": 0,
                    "data": null,
                    "labelIds": teal.getLabelIds(d[i].tealAttrLabels, ""),
                    "transformationIds": [],
                    "_previousAttributes": {
                        "id": 0,
                        "name": "",
                        "description": "",
                        "eventKey": "",
                        "type": teal.getAttributeType(d[i].tealAttrType),
                        "dataSourceType": "",
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
                        "fullyQualifiedId": "undefined" + teal.getAttributeTypeId(d[i].tealAttrType) + ".0"
                    },
                    "eventKey": "",
                    "dataSourceType": "",
                    "deleted": false,
                    "isPersonalInfo": false,
                    "classifications": [],
                    "config": {},
                    "eventDBEnabled": false,
                    "audienceDBEnabled": false,
                    "createdByPlay": [],
                    "fullyQualifiedId": teal.getAttributeTypeId(d[i].tealAttrType) + "." + gApp.utils.quantifier.getNextUniqueQuantifierId()
                }
                // adding new quantifier object to quantifier collections (add to UI)
                a = gApp.inMemoryModels.quantifierCollection.add(new gApp.models.Quantifier(attr));        
                // add attribute name to change log
              teal.m += '<li><span style="color:green">Created Attribute: <b>"' + a.attributes.name + '"</b> (' + a.get('id') + ')</span></li>';
            }
            // create enrichment for event attribute and add to visitor attribute
            t = teal.createEnrichment(d[i]);
        }
        // time finished
        te = new Date();
        teal.m += "</ol>";
        // add total processing time to change log
        teal.m += '<p>Total Time: <b>' + ((te - ts) / 1000) + 'sec</b></p>';
        // Pop up message with result after script ran
        gApp.utils.modal.show(new gApp.views.SimpleModalView({
            model: new Backbone.Model({
                title: "Event Configuration Successful!",
                message: teal.m
            })
        }))
    } catch (e) {
        gApp.utils.modal.show(new gApp.views.SimpleModalView({
            model: new Backbone.Model({
                title: "Attribute Creation Failed!",
                message: "<span style='color:red'>Attribute Creation Failed - Do Not Save/Publish.<br>Error Message: " + e.message + "</span>"
            })
        }))
    }
}