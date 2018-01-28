export { parse };

// parse in the following order:
// - patients
// - medications with name only (type 5)
// - medications with name then dosage (types 7, 8, 9)
// - medications with dosage then name (types 1, 2, 3, 4)
// - medications with dosage, then name, then secondary dosage (type 6)
// for medications, only the first dosage is used for the database, the second
// is added to the unit
// TODO: How to treat secondary dosages?
function parse(str) {
    let parsedObj = {type: '', data: {}};
    let patientRegex = /^\x02?(\w+)[,.]? (\w+)(?:DOB:\ ?)?(\d{1,2}[.\/]\d{1,2}[.\/](?:\d{4}|\d{2}XX))(?:(?:MRN:\ ?)?(\d{6}))?\x03?$/;
    let medicationNameRegex = /^\x02?[a-zA-Z]+\ ?(?:\((?:[a-zA-Z]\ ?)+\))?\ ?(?:[a-zA-Z]+\ ?)*\x03?$/;
    let medicationNameDosageRegex = /^\x02?((?:\d+(?:\.\d+)?% )?(?:[a-zA-Z]+\ ?)+(?:\((?:[a-zA-Z]+\ ?)+\))?) (\d+)\ ?(.*)\x03?$/;
    let medicationDosageNameRegex = /^\x02?(\d+(?:\.\d+)?)\ ?([a-zA-Z][0-9mcgElLq \/]+) ((?:(?:\d+(?:\.\d+)?% )?[a-zA-Z-]+\ ?)+)\x03?$/;
    let medicationDosageNameDosageRegex = /^\x02?(\d+)\ ?(\w+) ((?:[a-zA-Z]+\ ?)+) (\d+(?:[.,]?\d+)? .*)\x03?$/;
    let parseStr = patientRegex.exec(str);
    if (parseStr) {
        parsedObj.type = 'patient';
        parsedObj.data.last_name = parseStr[1];
        parsedObj.data.first_name = parseStr[2];
        parsedObj.data.dob = parseStr[3];
        if (parseStr[4]) {
            parsedObj.data.mrn = parseStr[4];
        }
    } else if ((parseStr = medicationNameRegex.exec(str))) {
        parsedObj.type = 'medication';
        parsedObj.data.name = parseStr[0];
        parsedObj.data.dosage_amount = 0;
        parsedObj.data.dosage_unit = '';
    } else if ((parseStr = medicationNameDosageRegex.exec(str))) {
        parsedObj.type = 'medication';
        parsedObj.data.name = parseStr[1];
        parsedObj.data.dosage_amount = parseStr[2];
        parsedObj.data.dosage_unit = parseStr[3];
    } else if ((parseStr = medicationDosageNameRegex.exec(str))) {
        parsedObj.type = 'medication';
        parsedObj.data.name = parseStr[3];
        parsedObj.data.dosage_amount = parseStr[1];
        parsedObj.data.dosage_unit = parseStr[2];
    } else if ((parseStr = medicationDosageNameDosageRegex.exec(str))) {
        parsedObj.type = 'medication';
        parsedObj.data.name = parseStr[3];
        parsedObj.data.dosage_amount = parseStr[1];
        parsedObj.data.dosage_unit = parseStr[2] + ' ' + parseStr[4];
    } else {
        console.error('QR Code "' + str + '" does not parse.');
    }
    console.log(parsedObj);
    return parsedObj;
}
