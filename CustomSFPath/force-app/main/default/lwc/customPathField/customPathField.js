import { LightningElement, api, wire } from 'lwc';
import getFieldsValues from '@salesforce/apex/CustomPathController.getFieldsValues';

export default class CustomPathField extends LightningElement {
    @api objectName;
    @api recordId;
    @api fieldValues;
    @api guideSelling;
    @api currStepNum=1;

    handleSuccess(event) {
        console.log('save handleSuccess : ', event.detail);
    }
    
    connectedCallback() {
        console.log('child comp');
        console.log('objectName : ', this.objectName);
        console.log('recordId : ', this.recordId);
        console.log('fieldValues : ', this.fieldValues);
        console.log('guideSelling : ', this.guideSelling);
        /*
        getFieldsValues({ objectName: this.objectName, recordId: this.recordId, fieldValues: this.fieldValues })
            .then(data => {

                this.fieldValues = data;
            })
            .catch(error => {
                console.error(error);
            });*/
    }

}
