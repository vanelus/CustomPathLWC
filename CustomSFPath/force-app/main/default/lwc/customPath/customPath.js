import { LightningElement, wire, api, track } from 'lwc';
import getCustomMetadataFields from '@salesforce/apex/CustomPathController.getCustomMetadataFields';
import getFieldsValues from '@salesforce/apex/CustomPathController.getFieldsValues';
import getObjectName from '@salesforce/apex/CustomPathController.getObjectName';
import getCurrentObjectStatus from '@salesforce/apex/CustomPathController.getCurrentObjectStatus';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';



export default class CustomPath extends LightningElement {
  @track stepFields;
  @track fieldsValues;
  @api objectName;
  @track objectStatusValue;
  @track currStepNum = 1;
  @track toggleDetail = true;
  @api recordId;
  wiredCustomMetadataFieldsResult;
  wiredObjectStatus;
  pathStatusField;
  wiredObjectNameResult;
  channelName = '/data/OpportunityChangeEvent';
  subscription = null;

  // 1. Utiliser `@wire` pour charger l'objet
  @wire(getObjectName, { recordIdString: '$recordId' })
  wiredObjectName(result) {
    this.wiredObjectNameResult = result; // Nécessaire pour `refreshApex`
    if (result.data) {
      this.objectName = result.data;
    } else if (result.error) {
      console.error(result.error);
    }
  }


  @wire(getCustomMetadataFields, { sObjName: '$objectName' })
  wiredCustomMetadataFields(result) {
    this.wiredCustomMetadataFieldsResult = result;
    if (result.data) {
      let tdata = this.transformInputData(result.data)[0];
      this.stepFields = tdata.steps;
      this.pathStatusField = tdata.StatusField__c;
      console.log('Étapes transformées :', this.stepFields);
    } else if (result.error) {
      console.error(result.error);
    }
  }

  @wire(getCurrentObjectStatus, { objectName: '$objectName', recordId: '$recordId', statusField: '$pathStatusField' })
  wiredStatus(result) {
    this.wiredObjectStatus = result;
    if (result.data) {
      this.objectStatusValue = result.data;
      this.updateStepFields(); // Appeler la méthode suivante
      this.loadFieldsValues(); // Charger les valeurs des champs
    } else if (result.error) {
      console.error(result.error);
    }
  }

  // 4. Mettre à jour les champs des étapes
  updateStepFields() {
    this.stepFields.forEach((item) => {
      item.IsActive = item.StepName__c === this.objectStatusValue;
      item.classNames = item.IsActive
        ? 'slds-path__item slds-is-current slds-is-active'
        : 'slds-path__item slds-is-incomplete';
    });
  }

  // 5. Charger les valeurs des champs
  loadFieldsValues() {
    const fieldsToLoad = JSON.stringify(this.getAllFields(this.stepFields));
    getFieldsValues({
      objectName: this.objectName,
      fieldsValuesJson: fieldsToLoad,
      recordId: this.recordId,
    })
      .then((result) => {
        this.fieldsValues = JSON.parse(result);
        console.log('Valeurs des champs :', this.fieldsValues);
        this.refreshChildComponent();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // Méthode pour rafraîchir le composant enfant
  refreshChildComponent() {
    const childComp = this.template.querySelector('c-custom-path-field');
    if (childComp) {
      const stepFieldsValues = this.computeStepFieldValues(
        this.stepFields,
        this.fieldsValues,
        this.currStepNum
      );
      childComp.currStepNum = this.currStepNum;
      childComp.step = JSON.stringify(stepFieldsValues);
      childComp.refresh();
    }
  }


  connectedCallback() {
    this.subscribeToChannel();
  }

  disconnectedCallback() {
    this.unsubscribeFromChannel();
  }

  // S'abonner au Change Event
  subscribeToChannel() {
    const messageCallback = (response) => {
      console.log('Change Event Received: ', response);
      this.handleEvent(response);
    };

    subscribe(this.channelName, -1, messageCallback).then((response) => {
      console.log('Subscription successful: ', response.channel);
      this.subscription = response;
    });

    // Gestion des erreurs
    onError((error) => {
      console.error('Error received: ', error);
    });
  }

  // Se désabonner du Change Event
  unsubscribeFromChannel() {
    if (this.subscription) {
      unsubscribe(this.subscription, (response) => {
        console.log('Unsubscribed successfully: ', response);
      });
    }
  }

  // Gérer les changements reçus
  handleEvent(response) {
    const changeType = response.data.payload.ChangeEventHeader.changeType;
    console.log('Change Type: ', changeType);
    console.log('response.data.payload: ', JSON.stringify(response.data.payload));

    // Exemples d'actions selon le type de changement
    if (changeType === 'UPDATE') {
      this.refreshData(); // Logique pour actualiser les données
    }
  }

  refreshData() {
    console.log('Forcing data refresh...');
    if (this.wiredObjectNameResult) {
      refreshApex(this.wiredObjectNameResult);
      refreshApex(this.wiredCustomMetadataFieldsResult);
      refreshApex(this.wiredObjectStatus).then(() => {
        this.loadFieldsValues();
      });
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
          StatusField__c: item.Object__r.StatusField__c,
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


  displayKeyFields(event) {
    this.currStepNum = Number(event.currentTarget.dataset.step); // Récupère la valeur de l'attribut data-step
    let currentFields = this.stepFields.find(step => step.StepNum__c === this.currStepNum).stepFields;
    this.refreshChildComponent();
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

    setTimeout(() => {
      // le timeout est nécessaire pour que le composant enfant soit rendu. =>  [TODO] trouver une meilleure solution
      const chilComp = this.template.querySelector('c-custom-path-field');
      console.log('chilComp : ', chilComp);
      if (chilComp && this.toggleDetail) {
        let stepfieldsValues = this.computeStepFieldValues(this.stepFields, this.fieldsValues, this.currStepNum);
        chilComp.currStepNum = this.currStepNum;
        chilComp.step = JSON.stringify(stepfieldsValues);
        chilComp.refresh();
      }

    }, 200);


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