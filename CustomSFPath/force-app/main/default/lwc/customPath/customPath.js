import { LightningElement, wire, api } from 'lwc';
import getCustomMetadataFields from '@salesforce/apex/CustomPathController.getCustomMetadataFields';
import getFieldsValues from '@salesforce/apex/CustomPathController.getFieldsValues';
import getObjectName from '@salesforce/apex/CustomPathController.getObjectName';


export default class CustomPath extends LightningElement {
    stepFields;
    fieldsValues;
    objectName;
    toggleDetail = true;
    @api recordId;


    @wire(getCustomMetadataFields)
    wiredMetadata({ error, data }) {
        if (data) {
            // Supposons que vous n'avez qu'une seule entrée dans votre tableau.
            // Adaptez la logique ci-dessous si vous attendez plusieurs entrées.
            console.log('donnee apex : ', data);
            let tdata = this.transformInputData(data);
            console.log('donnee tranformee : ', tdata);
            this.stepFields = this.extractSteps(tdata);
            console.log('steps : ', this.stepFields);

            getObjectName({ recordIdString: this.recordId })
            .then(result => {
                this.objectName = result;
                console.log('objectName : ', this.objectName);
            })
            .catch(error => {
              console.error(error);
            });

        } else if (error) {
            console.error(error);
        }
    }

  

    transformInputData(inputArray) {
      const output = [];

      inputArray.forEach(item => {
        let objectEntry = output.find(obj => obj.ObjectName__c === item.Object__r.ObjectName__c);
    
        if (!objectEntry) {
          objectEntry = {
            ObjectName__c: item.Object__r.ObjectName__c,
            Active__c: item.Object__r.Active__c,
            steps: []
          };
          output.push(objectEntry);
        }
    
        const step = {
          StepName__c: item.StepName__c,
          StepNum__c: item.StepNum__c,
          stepFields: item.CustomPathFields__r ? item.CustomPathFields__r.map(field => ({
            FieldApiName: field.FieldApiName__c
          })) : []
        };

        objectEntry.steps.push(step);
      });
    
      return output;
    
    }

    extractSteps(input) {
      // Initialise un tableau pour contenir toutes les étapes extraites
      const allSteps = [];
    
      // Itère sur chaque objet dans le tableau d'entrée
      input.forEach(item => {
        // Vérifie si l'objet actuel a un tableau 'steps' et l'ajoute au tableau allSteps
        if (item.steps && Array.isArray(item.steps)) {
          allSteps.push(...item.steps);
        }
      });
    
      // Retourne le tableau de toutes les étapes extraites
      return allSteps;
    }


    displayKeyFields(event) {
        const currStepNum = Number(event.currentTarget.dataset.step); // Récupère la valeur de l'attribut data-step
        let stepFields = this.stepFields.find(step => step.StepNum__c === currStepNum).stepFields;
        console.log('stepFields : ', stepFields);


        //call apex method updateFieldsValues to get the values of the fields
        getFieldsValues({ objectName: this.objectName, fieldsValuesJson: JSON.stringify(stepFields), recordId: this.recordId })
            .then(result => {
                this.fieldsValues = JSON.parse(result);
                console.log('result : ', result);
                console.log('fieldsValues : ', result);

            })
            .catch(error => {
                console.error(error);
            });


    }

    handleSuccess(event) {
        console.log('save handleSuccess : ', event.detail);
    }

    toggleDetailSection(event) {
        
        this.toggleDetail = !this.toggleDetail;
        let icon = this.template.querySelector('.slds-button');
        console.log('icon : ', icon);
        icon.classList.toggle('down');
        icon.classList.remove('slds-path__trigger_open');
    }
}