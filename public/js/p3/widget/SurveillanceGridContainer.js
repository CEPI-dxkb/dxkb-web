define([
  'dojo/_base/declare', 'dojo/on', 'dojo/dom-construct',
  'dijit/popup', 'dijit/TooltipDialog',
  './SurveillanceGrid', './AdvancedSearchFields', './GridContainer',
  '../util/PathJoin'

], function (
  declare, on, domConstruct,
  popup, TooltipDialog,
  SurveillanceGrid, AdvancedSearchFields, GridContainer,
  PathJoin
) {

  const dfc = '<div>Download Table As...</div><div class="wsActionTooltip" rel="text/tsv">Text</div><div class="wsActionTooltip" rel="text/csv">CSV</div><div class="wsActionTooltip" rel="application/vnd.openxmlformats">Excel</div>';
  const downloadTT = new TooltipDialog({
    content: dfc,
    onMouseLeave: function () {
      popup.close(downloadTT);
    }
  });

  return declare([GridContainer], {
    gridCtor: SurveillanceGrid,
    containerType: 'surveillance_data',
    tutorialLink: 'quick_references/organisms_taxon/surveillance_data.html',
    facetFields: AdvancedSearchFields['surveillance'].filter((ff) => ff.facet),
    advancedSearchFields: AdvancedSearchFields['surveillance'].filter((ff) => ff.search),
    filter: '',
    dataModel: 'surveillance',
    primaryKey: 'id',
    defaultFilter: '',
    tooltip: 'The “Surveillance” tab shows human, animal and avian surveillance records for select pathogen groups.',
    getFilterPanel: function (opts) {

    },
    containerActions: GridContainer.prototype.containerActions.concat([
      [
        'DownloadTable',
        'fa icon-download fa-2x',
        {
          label: 'DOWNLOAD',
          multiple: false,
          validTypes: ['*'],
          tooltip: 'Download Table',
          tooltipDialog: downloadTT
        },
        function () {
          const _self = this;

          const totalRows = _self.grid.totalRows;
          const dataType = _self.dataModel
          const primaryKey = _self.primaryKey
          const currentQuery = _self.grid.get('query')
          const authToken = (window.App.authorizationToken) ? `&http_authorization=${encodeURIComponent(window.App.authorizationToken)}` : ''
          const query = `${currentQuery}&sort(${primaryKey})&limit(${totalRows})&select(project_identifier,contributing_institution,sample_identifier,sequence_accession,sample_material,sample_transport_medium,sample_receipt_date,submission_date,last_update_date,longitudinal_study,embargo_end_date,collector_name,collector_institution,contact_email_address,collection_date,collection_year,collection_season,days_elapsed_to_sample_collection,collection_country,collection_state_province,collection_city,collection_poi,collection_latitude,collection_longitude,pathogen_test_type,pathogen_test_result,pathogen_test_interpretation,species,pathogen_type,subtype,strain,host_identifier,host_id_type,host_species,host_common_name,host_group,host_sex,host_age,host_height,host_weight,host_habitat,host_natural_state,host_capture_status,host_health,exposure,duration_of_exposure,exposure_type,use_of_personal_protective_equipment,primary_living_situation,nursing_home_residencedaycare_attendance,travel_history,profession,education,pregnancy,trimester_of_pregnancy,breastfeeding,hospitalized,hospitalization_duration,intensive_care_unit,chest_imaging_interpretation,ventilation,oxygen_saturation,ecmo,dialysis,disease_status,days_elapsed_to_disease_status,disease_severity,alcohol_or_other_drug_dependence,tobacco_use,packs_per_day_for_how_many_years,chronic_conditions,maintenance_medication,types_of_allergies,influenza_like_illness_over_the_past_year,infections_within_five_years,human_leukocyte_antigens,symptoms,onset_hours,sudden_onset,diagnosis,pre_visit_medication,post_visit_medication,treatment,initiation_of_treatment,duration_of_treatment,treatment_dosage,vaccination_type,days_elapsed_to_vaccination,source_of_vaccine_information,vaccine_lot_number,vaccine_manufacturer,vaccine_dosage,other_vaccinations,additional_metadata,comments,date_inserted)`

          on(downloadTT.domNode, 'div:click', function (evt) {
            const typeAccept = evt.target.attributes.rel.value

            const baseUrl = `${PathJoin(window.App.dataServiceURL, dataType)}/?http_accept=${typeAccept}&http_download=true`

            const form = domConstruct.create('form', {
              style: 'display: none;',
              id: 'downloadForm',
              enctype: 'application/x-www-form-urlencoded',
              name: 'downloadForm',
              method: 'post',
              action: baseUrl
            }, _self.domNode);
            domConstruct.create('input', {
              type: 'hidden',
              value: encodeURIComponent(query),
              name: 'rql'
            }, form);
            // Add authorization as form field for POST requests
            if (window.App.authorizationToken) {
              domConstruct.create('input', {
                type: 'hidden',
                value: window.App.authorizationToken,
                name: 'http_authorization'
              }, form);
            }
            form.submit();

            popup.close(downloadTT);
          });

          popup.open({
            popup: this.containerActionBar._actions.DownloadTable.options.tooltipDialog,
            around: this.containerActionBar._actions.DownloadTable.button,
            orient: ['below']
          });
        },
        true,
        'left'
      ]
    ])
  });
});
