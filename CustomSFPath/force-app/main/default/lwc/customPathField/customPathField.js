import { LightningElement, api, wire } from 'lwc';

export default class CustomPathField extends LightningElement {
    @api objectName;
    @api recordId;
    @api step;

    handleSuccess(event) {
        console.log('save handleSuccess : ', event.detail);
    }
    
    connectedCallback() {
        console.log('child comp triggered');
    }

    @api
    refresh(){
        console.log('refresh triggered');
        console.log('refresh triggered step', JSON.stringify(this.step) );
        console.log('refresh triggered objectName', this.objectName);
        this.stepObj = JSON.parse(this.step);
        console.log('refresh triggered stepObj', this.stepObj);
        //this.fieldValues = this.fieldValues[this.currStepNum];
    }
}
