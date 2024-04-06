import { LightningElement, wire, api, track } from 'lwc';
import getCustomMetadataFields from '@salesforce/apex/CustomPathController.getCustomMetadataFields';
import getFieldsValues from '@salesforce/apex/CustomPathController.getFieldsValues';
import getObjectName from '@salesforce/apex/CustomPathController.getObjectName';
import CustomPathField from 'c/customPathField';

export default class CustomPath extends LightningElement {
    @track stepFields;
    fieldsValues;
    @track objectName;  
    @track currStepNum=1;
    toggleDetail = true;
    @api recordId;


    @wire(getObjectName , { recordIdString: "$recordId" } )
    wiredMetadata({ error, data }) {
        if (data) {
            this.objectName = data;
            console.log('objectName : ', this.objectName);
            
            getCustomMetadataFields({ currentObjectName: this.objectName })
            .then(result => {
              console.log(' steps  : ', result);
              let tdata = this.transformInputData(result);
              console.log('donnee tranformee : ', tdata);
              this.stepFields = this.extractSteps(tdata);
              console.log('steps : ', this.stepFields);
              let fields = this.getAllFields(this.stepFields);
              return getFieldsValues({ objectName: this.objectName, fieldsValuesJson: JSON.stringify(fields), recordId: this.recordId });
            })
            .then(result => {
              this.fieldsValues = JSON.parse(result);
              console.log('fieldsValues : ', result);
              let chilComp = this.template.querySelector('c-custom-path-field');
              let stepfieldsValues = this.computeStepFieldValues(this.stepFields, this.fieldsValues, this.currStepNum);
              chilComp.currStepNum = this.currStepNum;
              chilComp.step = JSON.stringify(stepfieldsValues);
              chilComp.refresh();
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
        let currentFields = this.stepFields.find(step => step.StepNum__c === this.currStepNum).stepFields;
        let chilComp = this.template.querySelector('c-custom-path-field');
        let stepfieldsValues = this.computeStepFieldValues(this.stepFields, this.fieldsValues, this.currStepNum);
        chilComp.step =  JSON.stringify(stepfieldsValues);
        chilComp.currStepNum = this.currStepNum;
        chilComp.objectName = 'Opportunity';
        chilComp.refresh();

    }

    computeStepFieldValues(stepFields, fieldsValues, currStepNum) {
        console.log('computeStepFieldValues');
        const step = stepFields.find(step => step.StepNum__c === currStepNum);
   
        // Créez un tableau des FieldApiName dans stepFields
        const stepFieldNames = step.stepFields.map(field => field.FieldApiName);

        // Filtrez fieldsValues pour obtenir seulement les éléments dont FieldApiName est dans stepFieldNames
        const currFieldValues = fieldsValues.filter(field => stepFieldNames.includes(field.FieldApiName));
       
        // Ajoutez fieldValues à l'objet step
        step.fieldValues = currFieldValues;

        // Retourne l'objet step
        return step;

    }

    toggleDetailSection(event) {
        
        this.toggleDetail = !this.toggleDetail;
        let icon = this.template.querySelector('.slds-button');
        console.log('toggleDetailSection : ', this.toggleDetail);
        icon.classList.toggle('down');

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