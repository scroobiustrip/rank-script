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
        placeholder: 'e.g. 15087-4739f12e7b7b4bb9c1a7643e56b390bf',
      },
      {
        type: 'TEXTINPUT',
        name: 'campaignId',
        displayName: 'Campaign ID',
        helpText: 'Enter the unique identifier of the website',
        placeholder: 'e.g. 75387',
      },
      {
        type: 'TEXTINPUT',
        name: 'domain',
        displayName: 'Root Domain',
        helpText: 'Enter the root domain of your site.',
        placeholder: 'e.g. pistonheads.com',
      },
      {
        type: 'TEXTINPUT',
        name: 'datestart',
        displayName: 'Start date',
        helpText: 'Optional.  The start date',
        placeholder: 'YYYY-MM-DD',
      },
      {
        type: 'TEXTINPUT',
        name: 'dateend',
        displayName: 'End date',
        helpText: 'Optional.  The end date',
        placeholder: 'YYYY-MM-DD',
      },
    ]
  };
  return config;
}


var fixedSchema = [
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
    name: 'Url',
    label: 'Site Domain',
    description: 'Site title',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION',
      semanticType: 'TEXT',
      semanticGroup: 'TEXT',
    },
  },
  {
    name: 'LandingPage',
    label: 'Landing Page',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION',
      semanticType: 'TEXT',
      semanticGroup: 'TEXT'
    }
  },
  {
    name: 'Keyword',
    label: 'Keyword',
    description: 'Keyword',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION',
      semanticType: 'TEXT',
      semanticGroup: 'TEXT',
    },
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
    name: 'Rank',
    label: 'Rank',
    description: 'Keyword ranking position',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC',
      semanticType: 'NUMBER',
      semanticGroup: 'NUMERIC'
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

  // Fake request object to test getData() function //
  var request = {
    configParams: {
      "apiKey":'15087-4739f12e7b7b4bb9c1a7643e56b390bf',
      "campaignId":'75387',
      "domain":'pistonheads.com'
    },
    "fields" :[
      {"name":'date'},
      {"name":'url'},
      {"name":'lp'},
      {"name":'keyword'},
      {"name":'se'},
      {"name":'se_name'},
      {"name":'rank'}
      ],
  dateRange: {
    endDate: '2018-07-22',
    startDate: '2018-07-29'
  }
  };


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
    'https://www.rankranger.com/api/v2/?rank&key=',
    request.configParams.apiKey,
    '&start_date=',
    request.configParams.datestart,
    '&end_date=',
    request.configParams.dateend,
    '&campaign_id=',
    request.configParams.campaignId,
    '&domain=',
    request.configParams.domain,
    '&output=json'
  ];

  // Fetch the data - not sure which way is best to do this.
  
  // var response = JSON.parse(UrlFetchApp.fetch(url.join('')));
  // var result = response[0].result;
  
  var response = UrlFetchApp.fetch(url.join(''));
  var result = JSON.parse(response.getContentText());
  
  //var response = UrlFetchApp.fetch(url.join(''));
  //var result = JSON.parse(response).result;

  // Prepare the tabular data.
  var data = [];
  result.forEach(function(keyword_obj) {
  // var requestedData = result.map(function(keyword_obj) {
  // for( var keyword_obj in parsedResponse) {
      var values = [];
      dataSchema.forEach(function(field) {
        switch(field.name) {
          case 'Date':
            values.push(keyword_obj.date.replace(/(\d\d)\/(\d\d)\/(\d{4})/, "$3-$1-$2").replace(/-/g,""));
            break;
          case 'Url':
            values.push(keyword_obj.url);
            break;
          case 'LandingPage':
            values.push(keyword_obj.lp);
            break;
          case 'Keyword':
            values.push(keyword_obj.keyword);
            break;
          case 'searchEngine':
            values.push(keyword_obj.se);
            break;
          case 'searchEngineName':
            values.push(keyword_obj.se_name);
            break;
          case 'Rank':
            values.push(keyword_obj.rank);
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
