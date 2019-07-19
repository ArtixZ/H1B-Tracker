const axios = require("axios")
const FormData = require('form-data');
const proxyConfig = require('./proxy.json');

const { PROXY_IP, PORT, USERNAME, PASSWORD } = proxyConfig;

const url = 'https://egov.uscis.gov/casestatus/mycasestatus.do';

const bodyFormData = new FormData();
	bodyFormData.append('appReceiptNum', "EAC1916652140");
    bodyFormData.append('caseStatusSearchBtn', 'CHECK+STATUS');
    
    axios({
		method: 'POST',
        url: url,
        data: bodyFormData,
        
		headers: bodyFormData.getHeaders()
    }).then((res) => res.data || null)
    .then(data => {
        console.log(data)
    });