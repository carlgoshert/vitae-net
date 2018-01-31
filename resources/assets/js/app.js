
/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

require('./bootstrap');
require('./jquery.scannerdetection');
let parser = require('./parser');

window.Vue = require('vue');

const summaryPage = new Vue({
    el: '#summary-page',
    components: {
        'medication-list': require('./components/MedicationList.vue'),
        'patient': require('./components/Patient.vue')
    }
});

const addPatientPage = new Vue({
    el: '#patient-form',
    components: {
        'patient-form': require('./components/PatientForm.vue')
    }
});

const medicationForm = new Vue({
    el: '#medication-form',
    components: {
        'medication-form-list': require('./components/MedicationFormList.vue')
    }
});

function showAlert(message) {
    $('#scan-error-alert').html(`
    <div class="alert alert-danger alert-dismissable">
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
      <span>${message}</span>
    </div>`);
}

function deleteModal($, modelName) {
    $(`#${modelName}-delete-modal`).on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var model = button.data('id');
        var modal = $(this)
        modal.find(`#delete-${modelName}`).attr('action', `/${modelName}s/` + model);
    });
}

$(() => {
    // FIXME: find a better way to test this
    $(document).scannerDetection({
        timeBeforeScan: 200,
        startChar: [2],
        endChar: [3],
        avgTimeByChar: 40,
        stopPropagation: true,
        preventDefault: false,
        onComplete: (barcode, qty) => {
            let obj = parser.parse(barcode);
            if (obj.type === 'patient') {
                if ($('#summary-page').length) {
                    console.log(obj.data);
                    axios.post('/api/v1/patients/verify', obj.data).then(response => {
                        let data = response.data;
                        if (data.status === 'success') {
                            summaryPage.$emit('set-patient', data.data);
                        } else if (data.status === 'error') {
                            showAlert('Could not find this patient in the database.');
                            console.log(data.data);
                        }
                    }).catch(error => {
                        showAlert('Could not find this patient in the database');
                        console.error(error);
                    });
                } else {
                    console.log(obj.data);
                    addPatientPage.$emit('set-patient', obj.data);
                }
            } else if (obj.type === 'medication') {
                if ($('#summary-page').length) {
                    axios.post('/api/v1/medications/verify', obj.data).then(response => {
                        let data = response.data;
                        if (data.status === 'success') {
                            summaryPage.$emit('add-medication', data.data);
                            $('#form-extra').show();
                        } else if (data.status === 'error') {
                            showAlert('Could not find this medication in the database.');
                            console.log(data.data);
                        }
                    }).catch(error => {
                        showAlert('Could not find this medication in the database.');
                        console.error(error);
                    });
                } else {
                    console.log(obj.data);
                    medicationForm.$emit('add-medication', obj.data);
                }
            } else {
                showAlert('Scanning failed. Unknown code format');
                console.log(barcode);
                console.log(obj);
            }
        }
    });

    $('#add-medication').on('click', () => {
        medicationForm.$emit('add-medication', {name: '', dosage_amount: 0, dosage_unit: ''});
        $('[data-toggle="tooltip"]').tooltip();
    });

    deleteModal($, 'user');
    deleteModal($, 'patient');
    deleteModal($, 'medication');
    deleteModal($, 'order');
    deleteModal($, 'lab');
});
