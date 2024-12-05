public with sharing class CustomPathController {


    //get objetct name from recordId
    @AuraEnabled(cacheable=true)
    public static String getObjectName(String recordIdString){
        // Assurez-vous que la chaîne d'ID n'est pas nulle et essayez de convertir en Id
        if (String.isBlank(recordIdString)) {
            return null;
        }

        Id recordId = Id.valueOf(recordIdString);

        // Obtient le type SObjectType de l'ID de l'enregistrement
        Schema.SObjectType objectType = recordId.getSObjectType();
        
        // Obtient la description de l'objet
        Schema.DescribeSObjectResult describeResult = objectType.getDescribe();
        
        // Retourne le nom de l'objet
        return describeResult.getName();
    }

    //get the list of fields for the object objectName
    @AuraEnabled(cacheable=true)
    public static List<CustomPathSteps__mdt> getCustomMetadataFields(String sObjName) {
        // Remplacez 'YourCustomMetadataType__mdt' par le nom de votre CMT

        List<CustomPathSteps__mdt> metadataFields = [
            SELECT object__r.ObjectName__c, object__r.Active__c, object__r.StatusField__c, stepName__c, stepNum__c, GuideSelling__c, (SELECT FieldApiName__c FROM CustomPathFields__r)
            FROM CustomPathSteps__mdt
            WHERE object__r.Active__c = TRUE AND object__r.ObjectName__c =: sObjName
            ORDER BY stepNum__c ASC
        ];
        return metadataFields;
    }

    //get current current object status field value
    @AuraEnabled(cacheable=true)
    public static String getCurrentObjectStatus(String objectName, String recordId, string statusField) {
        String query = 'SELECT ' + statusField + ' FROM ' + objectName + ' WHERE Id = :recordId';
        SObject record = Database.query(query);
        return (String) record.get(statusField);
    }

    //get the fields values of the object objectName from a list of fields and for a specific recordId
    
    @AuraEnabled
    public static String getFieldsValues(String objectName, String fieldsValuesJson, String recordId) {

        system.debug('fieldsValuesJson'+ fieldsValuesJson);
        List<FieldWrapper> fieldValues = (List<FieldWrapper>) JSON.deserialize(fieldsValuesJson, List<FieldWrapper>.class);

        system.debug('fieldValues'+ JSON.serialize(fieldValues));
        String query = 'SELECT ';
        for (FieldWrapper fw : fieldValues) {
            query += fw.FieldApiName + ', ';
        }
        query = query.removeEnd(', ') + ' FROM ' + objectName + ' WHERE Id = :recordId';
        
        SObject record = Database.query(query);
        for (FieldWrapper fw : fieldValues) {
            fw.Value = String.valueOf(record.get(fw.FieldApiName));
        }

        return Json.serialize(fieldValues);
    }

    class FieldWrapper {
        public String FieldApiName;
        public String Value;
    }
}