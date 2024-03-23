import { LightningElement, wire, api, track } from 'lwc';
import getCustomMetadataFields from '@salesforce/apex/CustomPathController.getCustomMetadataFields';
import getFieldsValues from '@salesforce/apex/CustomPathController.getFieldsValues';
import getObjectName from '@salesforce/apex/CustomPathController.getObjectName';
import CustomPathField from 'c/customPathField';

export default class CustomPath extends LightningElement {
    @api stepFields;
    @api fieldsValues;
    @api objectName;  
    @api currStepNum;
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
            let fields = this.getAllFields(this.stepFields);
            console.log('fields : ', fields);

          getObjectName({ recordIdString: this.recordId })
            .then(result => {
              this.objectName = result;
              console.log('objectName : ', this.objectName);
              return getFieldsValues({ objectName: this.objectName, fieldsValuesJson: JSON.stringify(fields), recordId: this.recordId });
            })
            .then(result => {
              this.fieldsValues = JSON.parse(result);
              console.log('fieldsValues : ', this.fieldsValues);

              dynamicCtor = Child;
              dynamicProps = { name: 'Dynamic' };
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
          GuideSelling__c: item.GuideSelling__c,
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
        this.currStepNum = Number(event.currentTarget.dataset.step); // Récupère la valeur de l'attribut data-step
        console.log('currStepNum : ', this.currStepNum);
        let currentFields = this.stepFields.find(step => step.StepNum__c === this.currStepNum).stepFields;
        console.log('currentFields : ', currentFields);
        

    }

    toggleDetailSection(event) {
        
        this.toggleDetail = !this.toggleDetail;
        let icon = this.template.querySelector('.slds-button');
        console.log('icon : ', icon);
        icon.classList.toggle('down');
       // icon.classList.remove('slds-path__trigger_open');
    }

    getAllFields(stepFields) {
      const fieldValues = [];
  
      stepFields.forEach(item => {
          item.stepFields.forEach(field => {
              const newField = {
                  FieldApiName: field.FieldApiName,
                  Value: ""
              };
  
              fieldValues.push(newField);
          });
      });
  
      return fieldValues;
  }
}