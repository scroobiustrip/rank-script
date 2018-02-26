/**
 * This is one of the four requisites of a Data Studio connector. 
 * This function sends the Data Studio configuration parameters upon request.
 * Note that this example does not use a date range selector - where
 * dateRangeRequired would be set to true
 * See: https://developers.google.com/datastudio/connector/build
 *
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
        "name": "key",
        "displayName": "15087-4739f12e7b7b4bb9c1a7643e56b390bf",
        "helpText": "API key taken from Tools > Utilities > API Console.",
        "placeholder": "15087-4739f12e7b7b4bb9c1a7643e56b390bf"
      },
      {
        "type": "TEXTINPUT",
        "name": "campaign_id",
        "displayName": "75387",
        "helpText": "The campaign id to retrieve rankings from.",
        "placeholder": "75387"
      },
      {
        "type": "TEXTINPUT",
        "name": "domain",
        "displayName": "pistonheads.com",
        "helpText": "The root domain you want rank data on.",
        "placeholder": "pistonheads.com"
      },
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
    description: 'Date of rankings to select in YYYYMMDDHH',
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
    label: 'URL',
    dataType: 'STRING',
    semantics: {
    conceptType: 'DIMENSION'
    }
  },
  {
    name: 'landingPage',
    label: 'Landing Page',
    dataType: 'URL',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {  
    name: 'keyword',
    label: 'keyword',
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
    name: 'searchVolume',
    label: 'Search Volume',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC',
      isReaggregatable: true
    }
  },
  {  
    name: 'seachEngine',
    label: 'Search Engine',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {
    name: 'searchEngineName',
    label: 'Sarch Engine Name',
    dataType: 'TEXT',
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


/**
 * This is one of the four requisites of a Data Studio connector. 
 * This function sends the Data Studio schema upon request.
 * See: https://developers.google.com/datastudio/connector/build
 *
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
 * This is one of the four requisites of a Data Studio connector. 
 * This function is the main one called once a table or chart has been placed on
 * to the canvas. The request object includes all configParams with values, 
 * as well as a fields array of the selected dimensions and metrics (in order)
 * so that that the appropriate headers and rows can be returned to satisfy 
 * the request. 
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
  
  var startDate = request.dateRange.startDate;
  var endDate = request.dateRange.endDate;
  
  var dataConfig = {
   "date_start": startDate,
   "date_end": endDate,
  };
    
  var url_parts = [
    'https://www.rankranger.com/api/v2/?rank_stats&key=',
    request.configParams.key,
    '&date=',
    request.configParams.date,
    '&domain=',
    request.configParams.domain,
    '&campaign_id=',
    request.configParams.campaign_id,
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
            rankings_row.push(keyword_obj.keywordDate.date);
            break;
          case 'url':
            rankings_row.push(keyword_obj.keywordStats.url);
            break;
          case 'landingPage':
            rankings_row.push(keyword_obj.keywordStats.landingPage);
            break;
          case 'keyword':
            rankings_row.push(keyword_obj.keyword);
            break;
          case 'tags':
            rankings_row.push(keyword_obj.keywordStats.tags);
            break;
          case 'searchVolume':
            rankings_row.push(keyword_obj.keywordStats.searchVolume);
            break;
          case 'seachEngine':
            rankings_row.push(keyword_obj.keywordStats.seachEngine);
            break;
          case 'searchEngineName':
            rankings_row.push(keyword_obj.keywordStats.searchEngineName);
            break;
          case 'rank':
            rankings_row.push(keyword_obj.keywordRanking.rank || 101);
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
    console.info('The API returned a non-200 response. Please check your settings and try again');
    throw ("The API returned a non-200 response. Please check your settings and try again. ");
  }
  
}

/**
 * keywords are called from the STAT API one page at a time. This recursively allows for 
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
  
  var url_parts = ['https://www.rankranger.com/api/v2/?rank_stats&key=', settings.key, settings.date, settings.domain, settings.campaign_id ];
    
  if (existing_results.length == 0) {
    url_parts.push('&date=');
    url_parts.push('&domain=');
    url_parts.push('&campaign_id=');
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
