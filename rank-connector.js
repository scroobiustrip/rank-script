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
        placeholder: 'Enter your API Key in here.',
      },
      {
        type: 'TEXTINPUT',
        name: 'campaignId',
        displayName: 'Campaign ID',
        helpText: 'Enter the unique identifier of the website',
        placeholder: 'Add your Campaign ID.',
      },
      {
        type: 'TEXTINPUT',
        name: 'domain',
        displayName: 'Root Domain',
        helpText: 'Enter the root domain of your site.',
        placeholder: 'Enter the root domain of your website.',
      }
    ],
    dateRangeRequired: true
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
    'https://www.rankranger.com/api/v2/?rank&key=',
    request.configParams.apiKey,
    '&start_date=',
    request.dateRange.startDate,
    '&end_date=',
    request.dateRange.endDate,
    '&campaign_id=',
    request.configParams.campaignId,
    '&domain=',
    request.configParams.domain,
    '&output=json'
  ];

  // Fetch the data  
  var response = UrlFetchApp.fetch(url.join(''));
  var parsedResponse = JSON.parse(response.getContentText());

  // Prepare the tabular data.
  var data = [];
  parsedResponse.result.forEach(function(keyword_obj) {
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
