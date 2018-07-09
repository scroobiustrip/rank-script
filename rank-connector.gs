/*
 * @param {string} request - The configuration request from Data Studio.
 * @returns {object} 
 */

function getConfig(request) {
  var config = {
    "configParams": [
      {
        "type": "INFO",
        "name": "welcomeMessage",
        "text": "Full instructions tbc"
      },
      {
        "type": "TEXTINPUT",
        "name": "apiKey",
        "displayName": "API Key",
        "helpText": "You'll be provided with this :)",
        "placeholder": "API Key"
      },
      {
        "type": "TEXTINPUT",
        "name": "campaignId",
        "displayName": "Campaign ID",
        "helpText": "We need to retrieve this through the API",
        "placeholder": "Campaign ID"
      },
      {
        "type": "TEXTINPUT",
        "name": "domain",
        "displayName": "Root Domain",
        "helpText": "The root domain of your rank ranger login url.",
        "placeholder": "root domain"
      }
    ],
    "dateRangeRequired": true
  };
  return config;
}


/**
 * This is one of the four requisites of a Data Studio connector. 
 * Store this in the global scope for reference across the Script.
 * See: https://developers.google.com/datastudio/connector/build
 */
var dataSchema = [
 {
    name: 'date',
    label: 'Date',
    description: 'Date of rankings to select in YYYY-MM-DD',
    group: 'Date',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION',
      semanticType: 'YEAR_MONTH_DAY',
      semanticGroup: 'DATE'
    }
  },
  {
    name: 'url',
    label: 'Domain',
    dataType: 'STRING',
    semantics: {
    conceptType: 'DIMENSION'
    }
  },
  {
    name: 'lp',
    label: 'Landing Page',
    dataType: 'URL',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {
    name: 'keyword',
    label: 'Keyword',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {  
    name: 'tags',
    label: 'Tags',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {
    name: 'search_volume',
    label: 'Search Volume',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'DIMENSION',
      isReaggregatable: true
    }
  },
  {  
    name: 'se',
    label: 'Search Engine',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {
    name: 'se_name',
    label: 'Sarch Engine Name',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {
    name: 'rank',
    label: 'Rank',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC',
      isReaggregatable: false
    }
  }
];


/*
 * @param {string} request - The request from Data Studio.
 * @returns {object} 
*/

function getSchema(request) {
  return {schema: dataSchema};
}


/**
 * This is one of the four requisites of a Data Studio connector. 
 * This function specifies the required authentication for this Script.
 * In this example, no OAuth authentication is required 
 * as the API key is a configParam
 * For OAuth see: https://developers.google.com/datastudio/connector/oauth2
 *
 * @returns {object} 
 */

function getAuthType() {
  var response = {
    "type": "NONE"
  };
  return response;
}


/**
 *
 * See: https://developers.google.com/datastudio/connector/build
 *
 * @param {string} request - The request from Data Studio.
 * @returns {object} 
 */

function getData(request) {
  var header_rows = [];
  for (var i = 0; i < request.fields.length; i++) {
    for (var j = 0; j < dataSchema.length; j++) {
      if (dataSchema[j].name == request.fields[i].name) {
        header_rows.push(dataSchema[i]);
      }
    }
  }
  
  var startDate = request.dateRange.startDate;       /* Should hopefully build the date parameter in the URL? */

  
  var url_parts = [
    'https://www.rankranger.com/api/v2/?rank_stats&key=',
    request.configParams.apiKey,
    '&date=',
    startDate,
    '&campaign_id=',
    request.configParams.campaignId,
    '&domain=',
    request.configParams.domain,
    '&output=json'
  ];
  
  var all_results = get_keywords_recursive(request.configParams); 
  
  if (all_results.length > 0) {    
    var rankings_rows = [];
    for (var i = 0; i < all_results.length; i++) {
      var keyword_obj = all_results[i];
     
      var rankings_row = [];
      for (var j = 0; j < header_rows.length; j++) {
        switch (header_rows[j].name) {
          case 'date':
            rankings_row.push(keyword_obj.date);
            break;
          case 'url':
            rankings_row.push(keyword_obj.url);
            break;
          case 'lp':
            rankings_row.push(keyword_obj.lp);
            break;
          case 'keyword':
            rankings_row.push(keyword_obj.keyword);
            break;
          case 'tags':
            rankings_row.push(keyword_obj.tags);
            break;
          case 'search_volume':
            rankings_row.push(keyword_obj.search_volume);
            break;
          case 'se':
            rankings_row.push(keyword_obj.se);
            break;
          case 'se_name':
            rankings_row.push(keyword_obj.se_name);
            break;
          case 'rank':
            rankings_row.push(keyword_obj.rank || 101);
            break;
        }
      }
      rankings_rows.push({
        'values': rankings_row
      });
    }    
    var return_data = {
      schema: header_rows,
      rows: rankings_rows,
      cachedData: false
    };
    return return_data;
  } else {
    console.info('The Rank Ranger API returned a non-200 response. Please check your settings and try again');
    throw ("The Rank Ranger API returned a non-200 response. Please check your settings and try again. ");
  }
  
}

/**
 * Keywords are called from the STAT API one page at a time. This recursively allows for 
 * pagination of these results into sequential requests to the API endpoint. 
 * Each request results are then appended to the existing results and then eventually returned
 * back to the getData() function.
 *
 * @param {object} settings - This is the configParams from the Data Studio request.
 * @param {array} existing_results - The request from Data Studio.
 * @param {string} request - The request from Data Studio.
 * @returns {array} 
 */
function get_keywords_recursive( settings, existing_results, next_url ) {
  existing_results = existing_results || [];
  next_url = next_url || false;
  
  var startDate = request.startDate.date;    /*  Got to figure how to get the date needed from getData() function's local scope  */
  
  var url_parts = ['https://www.rankranger.com/api/v2/?rank_stats&key=', settings.apiKey, '&date=' ];
    
  if (existing_results.length == 0) {
    url_parts.push(startDate);              /*  Same as above need to access the user requested date to build URL */
    url_parts.push('&campaign_id=');
    url_parts.push(settings.campaignId);
    url_parts.push('&domain=');
    url_parts.push(settings.domain);
    url_parts.push('&output=json');
  } else {
    url_parts.push(next_url);
  } 
    
  var request_url = url_parts.join(''); 
  var response = UrlFetchApp.fetch( request_url );
  var results = JSON.parse( response.getContentText() );
   
  if (results.Response.nextpage) {
    existing_results = existing_results.concat(results.Response.Result);
    return existing_results.concat( get_keywords_recursive( settings, existing_results, results.Response.nextpage ) ); 
  } else {
    return results.Response.Result;   
  }
}
