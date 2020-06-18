/*
 * account 
 */
db.api_clients.insert({
  "_id" : "1234567890.apps.ch.gov.uk",
  "app_name" : "CHS",
  "client_secret" : "M2UwYzRkNzIwOGQ1OGQ0OWIzMzViYjJjOTEyYTc1",
  "user_id" : "Y2VkZWVlMzhlZWFjY2M4MzQ3MT",
  "redirect_uris" : [
    "http://chs-dev/oauth2/user/callback",
    "http://account.chs-dev/oauth2/user/callback"
  ],
  "type" : "web",
  "is_internal_app": true
})

db.api_clients.insert({
  "_id" : "MGQ1MGNlYmFkYzkxZTM2MzlkNGVmMzg4ZjgxMmEz",
  "type" : "key",
  "app_name" : "ch.gov.uk API key",
  "user_id" : "Y2VkZWVlMzhlZWFjY2M4MzQ3MT",
  "can_fetch_api_client" : 1,
  "can_fetch_bearer_token" : 1,
  "restricted_ips" : [],
  "js_domains" : []
})

db.company_auth_codes.insert({
    "_id" : "01777777",
    "auth_code" : "$2a$10$uS7dsFz8iIuNvXQK6dG1v.F//uQajFz0BLc60/B8qrGqsdFrU77MO",
    "is_active" : true
})

db.users.insert({
  "_id" : "Y2VkZWVlMzhlZWFjY2M4MzQ3MT",
  "surname" : null,
  "locale" : "GB_en",
  "password" : "$2a$10$6a..eerV1kSiNW3sBlcYv.VmEXyI7ABWuoo3w7zKzcdh18YKyvPbm",
  "forename" : null,
  "email" : "demo@ch.gov.uk",
  "created" : { "$date" : 1420070400000 }
})

/*
 * company_profile 
 */
db = db.getSiblingDB('company_profile')

db.company_profile.insert({
  "_id":"01777777",
  "data":{
     "has_been_liquidated":false,
     "date_of_creation":440121600000,
     "registered_office_address":{
        "region":"West Drayton",
        "address_line_2":"PO BOX 365",
        "address_line_1":"Waterside",
        "locality":"Harmondsworth",
        "postal_code":"UB7 0GB"
     },
     "last_full_members_list_date":1438300800000,
     "company_name":"BRITISH AIRWAYS PLC",
     "type":"plc",
     "sic_codes":[
        "51101",
        "51102",
        "52230",
        "52242"
     ],
     "jurisdiction":"england-wales",
     "company_number":"01777777",
     "accounts":{
        "next_accounts":{
           "period_start_on":1483228800000,
           "overdue":false,
           "due_on":1530316800000,
           "period_end_on":1514678400000
        },
        "next_made_up_to":1514678400000,
        "next_due":1530316800000,
        "accounting_reference_date":{
           "day":"31",
           "month":"12"
        },
        "last_accounts":{
           "type":"group",
           "made_up_to":1483142400000,
           "period_start_on":1451606400000,
           "period_end_on":1483142400000
        },
        "overdue":false
     },
     "undeliverable_registered_office_address":false,
     "etag":"4d14d60a5a82d656ef0a031f9c425f040c6da950",
     "has_insolvency_history":false,
     "company_status":"active",
     "officer_summary":{
        "resigned_count":42,
        "officers":[
           {
              "appointed_on":1381449600000,
              "name":"FLEMING, Andrew Ian",
              "officer_role":"secretary"
           },
           {
              "date_of_birth":-125107200000,
              "officer_role":"director",
              "name":"CRUZ DE LLANO, Alejandro",
              "appointed_on":1459382400000
           },
           {
              "date_of_birth":-9331200000,
              "officer_role":"director",
              "name":"EMBLETON, Lynne Louise",
              "appointed_on":1452124800000
           },
           {
              "appointed_on":1456444800000,
              "officer_role":"director",
              "name":"GUNNING, Stephen William Lawrence",
              "date_of_birth":-88387200000
           },
           {
              "appointed_on":1296518400000,
              "date_of_birth":-73267200000,
              "officer_role":"director",
              "name":"PATTERSON, Gavin Echlin"
           }
        ],
        "active_count":7
     },
     "has_charges":true,
     "previous_company_names":[

     ],
     "confirmation_statement":{
        "overdue":false,
        "next_due":1502668800000,
        "next_made_up_to":1501459200000,
        "last_made_up_to":1469923200000
     },
     "links":{
        "self":"/company/01777777",
        "filing_history":"/company/01777777/filing-history",
        "officers":"/company/01777777/officers",
        "charges":"/company/01777777/charges",
        "persons_with_significant_control":"/company/01777777/persons-with-significant-control"
     },
     "registered_office_is_in_dispute":false
  },
  "has_mortgages":true,
  "updated":{
     "type":"company_delta",
     "by":"58f5ca9a77af441106744200",
     "at":1492503195390
  },
  "created":{
     "type":"refresh_from_mongo",
     "by":"54e8c5cb85dccb11dd4e4773",
     "at":1424541131816
  },
  "delta_at":1492506753000
})

/*
 * appointments 
 */
db = db.getSiblingDB('appointments')

db.appointments.insert({
  "_id":"hrFCOJq1nFmw098EXHEjoznA4K0",
  "internal_id":"12346939",
  "data":{
     "updated_at":1432503011000,
     "links":{
        "officer":{
           "appointments":"/officers/J18mXSM4WHz7Ms7st0guroWwJRM/appointments",
           "self":"/officers/J18mXSM4WHz7Ms7st0guroWwJRM"
        },
        "self":"/company/01777777/appointments/hrFCOJq1nFmw098EXHEjoznA4K0"
     },
     "is_pre_1992_appointment":true,
     "etag":"015ab53552e02f53c8d92e50a678d30628256e73",
     "appointed_before":"1992-07-31",
     "forename":"Michael",
     "nationality":"British",
     "surname":"ANGUS",
     "date_of_birth":-1251590400000,
     "resigned_on":963273600000,
     "title":"Sir",
     "other_forenames":"Richardson",
     "officer_role":"director",
     "occupation":"Chairman Unilever",
     "company_number":"01777777",
     "service_address":{
        "region":"Gloucestershire",
        "postal_code":"GL7 7BX",
        "locality":"Cirencester",
        "address_line_2":"North Cerney",
        "address_line_1":"Cerney House"
     }
  },
  "appointment_id":"hrFCOJq1nFmw098EXHEjoznA4K0",
  "officer_id":"J18mXSM4WHz7Ms7st0guroWwJRM",
  "updated":{
     "at":1433406704142
  },
  "delta_at":"20150524213011092709",
  "created":{
     "at":1433406704142
  },
  "officer_role_sort_order":200,
  "company_name":"BRITISH AIRWAYS PLC",
  "company_number":"01777777",
  "company_status":"active"
})

/*
 * company_metrics 
 */
db = db.getSiblingDB('company_metrics')

db.company_metrics.insert({
  "_id":"01777777",
  "updated":{
     "at":1495723888974,
     "by":"5926e46585dccbe1e2bc964d",
     "type":"company_metrics"
  },
  "data":{
     "etag":"f1a8fc38b37757060cec7ad34e0ed4dbf730346d",
     "mortgage":{
        "total_count":817,
        "satisfied_count":133,
        "part_satisfied_count":0
     },
     "counts":{
        "appointments":{
           "active_llp_members_count":0,
           "active_directors_count":6,
           "total_count":49,
           "resigned_count":42,
           "active_secretaries_count":1,
           "active_count":7
        },
        "persons-with-significant-control":{
           "ceased_pscs_count":0,
           "total_count":2,
           "statements_count":0,
           "pscs_count":2,
           "active_statements_count":0,
           "active_pscs_count":2,
           "withdrawn_statements_count":0
        }
     }
  }
})
