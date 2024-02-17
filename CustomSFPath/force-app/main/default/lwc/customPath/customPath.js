import { LightningElement, wire, api } from 'lwc';
import getCustomMetadataFields from '@salesforce/apex/CustomPathController.getCustomMetadataFields';
import getFieldsValues from '@salesforce/apex/CustomPathController.getFieldsValues';


export default class CustomPath extends LightningElement {
    metadataFields;
    stepFields;
    fieldsValues;
    @api recordId;

    @wire(getCustomMetadataFields)
    wiredMetadata({ error, data }) {
        if (data) {
            // Supposons que vous n'avez qu'une seule entrée dans votre tableau.
            // Adaptez la logique ci-dessous si vous attendez plusieurs entrées.
            console.log('donnee apex : ', data);
            this.metadataFields = data.map(record => ({
                StepId: record.QualifiedApiName,
                StepName: record.MasterLabel,
                ObjName: record.ObjectName__c,
                fields: record.CustomPathFields__r
            }));
            console.log('this.metadataFields : ', this.metadataFields);
        } else if (error) {
            console.error(error);
        }
    }

    displayKeyFields(event) {
        const stepName = event.currentTarget.dataset.step; // Récupère la valeur de l'attribut data-step
        this.stepFields = this.metadataFields.find(step => step.StepName === stepName).fields;
        console.log('fields : ', this.stepFields);


        //how to transform the fields to a map Map<String, String> fieldsValues to be used as param of the apex method updateFieldsValues
        this.fieldsValues = this.stepFields.reduce((map, item) => {
            map[item.FieldApiName__c] = '';
            return map;
        }, {});

        console.log('fieldsValues : ', this.fieldsValues);
        console.log('recordId : ', this.recordId);

        //call apex method updateFieldsValues to get the values of the fields
        getFieldsValues({ objectName: 'Contact', fieldsValues: this.fieldsValues, recordId: this.recordId })
            .then(result => {
                this.fieldsValues = result;
                console.log('result : ', result);
            })
            .catch(error => {
                console.error(error);
            });


    }

    handleSuccess(event) {
        console.log('save handleSuccess : ', event.detail);
    }
}