function getAuthType() {
  var response = {
    'type': 'NONE'
  };
  return response;
}


function getConfig(request) {
  var config = {
    configParams: [
      {
        type: 'TEXTINPUT',
        name: 'apiKey',
        displayName: 'API Key',
        helpText: 'Enter the API Key you get from the Tools > Utilities > API Console',
        placeholder: 'Your API Key here :)',
      },
      {
        type: 'TEXTINPUT',
        name: 'campaignId',
        displayName: 'Campaign ID',
        helpText: 'Enter the unique identifier of the website',
        placeholder: 'Unique 5 Digit number',
      },
      {
        type: 'TEXTINPUT',
        name: 'domain',
        displayName: 'Root Domain',
        helpText: 'Enter the root domain of your site.',
        placeholder: 'e.g. myawesomesite.com',
      },
      {
        type: 'TEXTINPUT',
        name: 'searchEngineId',
        displayName: 'Search Engine ID',
        helpText: 'Enter Search Engine ID you want rankings for. Mobile - 433, Desktop - 64',
        placeholder: 'Deskop: 64 Mobile: 443',
      }
    ],
    dateRangeRequired: true
  };
  return config;
}


var fixedSchema = [
  {
    name: 'Url',
    label: 'Site Domain',
    description: 'Site title',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION',
      semanticType: 'TEXT',
      semanticGroup: 'TEXT'
    }
  },
  {
    name: 'searchEngine',
    label: 'Search Engine',
    description: 'Name of the search engine.',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION',
      semanticType: 'TEXT',
      semanticGroup: 'TEXT'
    }
  },
  {
    name: 'searchEngineName',
    label: 'Search Engine Name',
    description: 'Full name of the search engine.',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION',
      semanticType: 'TEXT',
      semanticGroup: 'TEXT'
    }
  },
  {
    name: 'Date',
    label: 'Date',
    description: 'Date',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION',
      semanticType: 'YEAR_MONTH_DAY',
      semanticGroup: 'DATETIME'
    }
  },
  {
    name: 'Visibility',
    label: 'Visibility',
    description: 'Search Engine Visibility Score',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC',
      semanticType: 'NUMBER',
      semanticGroup: 'NUMERIC',
      isReaggregatable: false
    }
  }
];


function getSchema(request) {
  return {schema: fixedSchema};
};

function isAdminUser() {
  return true;
}

function getData(request) {
  // Prepare the schema for the fields requested.
  var dataSchema = [];

  request.fields.forEach(function(field) {
    for (var i = 0; i < fixedSchema.length; i++) {
      if (fixedSchema[i].name === field.name) {
        dataSchema.push(fixedSchema[i]);
        break;
      }
    }
  });

  // Build URL
    var url = [
    'https://www.rankranger.com/api/v2/?get_visibility_trend&key=',
    request.configParams.apiKey,
    '&start_date=',
    request.dateRange.startDate,
    '&end_date=',
    request.dateRange.endDate,
    '&campaign_id=',
    request.configParams.campaignId,
    '&domain=',
    request.configParams.domain,
    '&se_id=',
    request.configParams.searchEngineId,
    '&output=json'
  ];


  // Fetch the data - not sure which way is best to do this.

  // var response = JSON.parse(UrlFetchApp.fetch(url.join('')));
  // var result = response[0].result;

  var response = UrlFetchApp.fetch(url.join(''));
  var parsedResponse = JSON.parse(response.getContentText()); // would remove .result and instead use it as results.result.forEach

  function isEmptyObject(obj) {
    for(var prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        return false;
      }
    }
    return true;
  }

  //var response = UrlFetchApp.fetch(url.join(''));
  //var result = JSON.parse(response).result;

  // Prepare the tabular data.
  var data = [];
  parsedResponse.result.forEach(function(keyword_obj) {
      var values = [];
      dataSchema.forEach(function(field) {
        switch(field.name) {
          case 'Url':
            values.push(keyword_obj.url);
            break;
          case 'searchEngine':
            values.push(keyword_obj.se);
            break;
          case 'searchEngineName':
            values.push(keyword_obj.se_name);
            break;
          case 'Date':
            values.push(keyword_obj.date.replace(/(\d\d)\/(\d\d)\/(\d{4})/, "$3-$1-$2").replace(/-/g,""));
            break;
          case 'Visibility':
            values.push(keyword_obj.visibility_score);
            break;
          default:
            values.push('');
        }
      });

      data.push({
        values: values
      });
  });

  return {
    schema: dataSchema,
    rows: data
  };
}
