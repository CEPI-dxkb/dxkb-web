define([
  'dojo/_base/declare', 'dojo/_base/array', 'dojo/topic', 'dijit/_WidgetBase', 'dojo/on',
  'dojo/fx/Toggler',
  'dojo/dom-class', 'dijit/_TemplatedMixin', 'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./templates/StabilityPrediction.html', './AppBase',
  'dojo/_base/lang', '../../WorkspaceManager', './rcsbList', './pdbDropdown'
], function (
  declare, array, Topic, WidgetBase, on,
  Toggler,
  domClass, Templated, WidgetsInTemplate,
  Template, AppBase, lang, WorkspaceManager, rcsbList, pdbDropdown
) {
  return declare([AppBase], {
    baseClass: 'StabilityPrediction',
    templateString: Template,
    applicationName: 'StabilityPrediction',
    requireAuth: true,
    applicationLabel: 'Stability Prediction',
    applicationDescription: 'The Stability Prediction Service predicts Stability Prediction using tools like ThermoMPNN-D.',
    applicationHelp: 'quick_references/services/stability_prediction_service.html',
    tutorialLink: 'tutorial/stability_prediction/stability_prediction.html',
    videoLink: '',
    pageTitle: 'Stability Prediction Service | BV-BRC',
    required: true,
    code_four: false,
    defaultPath: '',

    constructor: function () {
      this._autoTaxSet = false;
      this._autoNameSet = false;
    },

    startup: function () {
      var _self = this;
      rcsbList.getEntryIds().then(function(ids) {
          console.log("Total IDs:", ids.length);
          var validPDBIDs = ids;
          console.log("First few IDs:", ids.slice(0, 10));
          console.log("All IDs: ", validPDBIDs);
          this.pdb_list = validPDBIDs;
          pdbDropdown.initDropdown(this.pdb_list);
        }, function(err) {
          console.error("Error fetching PDB IDs:", err);
        });
      if (this._started) { return; }
      this.inherited(arguments);
      if (this.requireAuth && (window.App.authorizationToken === null || window.App.authorizationToken === undefined)) {
        return;
      }
      _self.defaultPath = WorkspaceManager.getDefaultFolder() || _self.activeWorkspacePath;
      _self.output_path.set('value', _self.defaultPath);
      this.form_flag = false;
      try {
        this.intakeRerunForm();
      } catch (error) {
        console.error(error);
      }
    },
    postCreate: function () {
      this.onInputChange()
    },

    onPbdFileUpload: function (val) {
      this.inherited(arguments)
      this.user_pdb_preview.set('disabled', false);
    },

    onProteinInputChange: function (evt) {
      this.protein_databank_selection
      if (this.protein_databank_selection.checked) {
        this.protein_databank_selection.value = "input_pdb";
      }
      else if (this.user_pdb_file.checked) {
        this.protein_databank_selection.value = "user_pdb_file";
      }
    },

    onInputChange: function (evt) {
      if (typeof this.protein_databank_selection != "undefined"){
        // protein radio buttons
        if (this.protein_databank_selection.checked) {
          // set display logic
          dojo.style(this.block_pdb_list, "display", "block");
          dojo.style(this.block_pdb_upload, "display", "none");
        }
        else if (this.user_pdb_file.checked) {
          dojo.style(this.block_pdb_list, "display", "none");
          dojo.style(this.block_pdb_upload, "display", "block");
        }
      }
      },

    openJobsList: function () {
      Topic.publish('/navigate', { href: '/job/' });
    },

    getValues: function () {
      var values = this.inherited(arguments);
      console.log("VALS", values);
      var submit_values = {
        output_path: values.output_path,
        output_file: values.output_file,
        batch_size: 256,
        chains: values.chains,
        distance: values.distance,
        mode: values.mode,
        ss_penalty: values.ss_penalty,
        threshold: values.threshold
      }
      if (values.protein_input === "input_pdb")
      {
//        submit_values.protein_input_type = values.protein_input
        submit_values.pdb_id = values.pdbDropdown
      }
      // repeat for pdb files
      else if (values.protein_input === "user_pdb_file")
      {
//        submit_values.protein_input_type = values.protein_input
        submit_values.pdb = values.user_pdb;
      }

      return submit_values;
    },

    checkParameterRequiredFields: function () {
      if (
        (this.pdb_list.get('item') || this.user_pdb.get('value')) &&
        this.output_path.get('value') &&
        this.output_file.get('displayedValue')
      ) {
        this.validate();
      } else {
        if (this.submitButton) {
          this.submitButton.set('disabled', true);
        }
      }
    },

    onOutputPathChange: function (val) {
      this.inherited(arguments);
      this.checkParameterRequiredFields();
    },

    checkOutputName: function (val) {
      this.inherited(arguments);
      this.checkParameterRequiredFields();
    },

    addRerunFields: function (job_params) {
      // Protein Input
      if (job_params.protein_input_type === 'user_pdb_file'){
        this.protein_databank_selection.set('checked', false);
        this.user_pdb.set('value', job_params["user_pdb_file"])
        this.user_pdb_file.set('checked', true);
      }
      else if (job_params.protein_input_type === 'input_pdb'){
        this.pdb_list.set('value', job_params["input_pdb"]);
      }
      else {
        console.log( 'Invalid protein input');
      }
      // ligand library is not working just yet
      var ligand_library_type = job_params['ligand_library_type'];
      if (ligand_library_type === "ws_file"){
        this.ws_file.checked
        this.ws_file.set('value', ligand_library_type);
        this.ligand_ws_file.set('value', job_params['ligand_ws_file']);
      }
      else if (ligand_library_type === "smiles_list"){
        this.input_sequence.checked;
        this.input_sequence.set('value', ligand_library_type);
        let user_input = job_params['ligand_smiles_list'];
        let combined_string = '';
        user_input.forEach(subArray => {
          console.log(subArray);
          combined_string += subArray[0] + ' ' + subArray[1] + '\n'
        });
        this.smiles_text.set('value', combined_string);
      }
      else if (ligand_library_type === "named_library"){
        this.ligand_named_library.checked;
        this.ligand_named_library.set('value', ligand_library_type);
        this.smiles_dropdown_attach_point.set('value', job_params['ligand_named_library']);
      }
      else {
        console.log("Improper ligand library type passed.")
      }
      this.output_path.set('value', job_params['output_path']);
      },

    intakeRerunForm: function () {
      // assuming only one key
      var service_fields = window.location.search.replace('?', '');
      var rerun_fields = service_fields.split('=');
      var rerun_key;
      if (rerun_fields.length > 1) {
        rerun_key = rerun_fields[1];
        var sessionStorage = window.sessionStorage;
        if (sessionStorage.hasOwnProperty(rerun_key)) {
          try {
            var param_dict = { 'output_folder': 'output_path', 'strategy': 'recipe' };
            AppBase.prototype.intakeRerunFormBase.call(this, param_dict);
            // This grabs the job parameters according to the rerun key (from the brower memory)
            this.addRerunFields(JSON.parse(sessionStorage.getItem(rerun_key)));
            this.form_flag = true;
          } catch (error) {
            console.log('Error during intakeRerunForm: ', error);
          } finally {
            sessionStorage.removeItem(rerun_key);
          }
        }
      }
    }
  });
});
