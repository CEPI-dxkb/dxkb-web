define([
    'dojo/_base/declare', 'dojo/_base/lang', 'dojo/_base/Deferred',
    'dojo/on', 'dojo/query', 'dojo/dom-class', 'dojo/dom-construct', 'dojo/dom-style', 'dojo/topic',
    './AppBase',
    'dojo/text!./templates/AlphaFold.html', 'dijit/form/Form',
    '../../util/PathJoin', '../../WorkspaceManager', '../WorkspaceObjectSelector', '../../DataAPI'
  ], function (
    declare, lang, Deferred,
    on, query, domClass, domConstruct, domStyle, Topic,
    AppBase,
    Template, FormMixin, PathJoin, WorkspaceManager, WorkspaceObjectSelector, DataAPI
  ) {

    return declare([AppBase], {
      baseClass: 'AlphaFold',
      templateString: Template,
      applicationName: 'AlphaFold',
      requireAuth: true,
      applicationLabel: 'AlphaFold',
      applicationDescription: 'AlphaFold predicts a protein\'s 3D structure from its amino acid sequence using deep learning',
      applicationHelp: 'quick_references/services/alphafold.html',
      tutorialLink: 'tutorial/alphafold/alphafold.html',
      videoLink: 'https://youtu.be/PJ9vdCnozMg',
      pageTitle: 'AlphaFold Service | BV-BRC',
      defaultPath: '',

      constructor: function () {
        this.paramToAttachPt = ['output_path', 'fasta_paths', 'model_preset', 'db_preset', 'output_file'];
      },

      startup: function () {
        if (this._started) { return; }
        if (this.requireAuth && (window.App.authorizationToken === null || window.App.authorizationToken === undefined)) {
          return;
        }
        this.inherited(arguments);

        // Set default path
        if (window.App.user) {
          this.defaultPath = WorkspaceManager.getDefaultFolder() || this.activeWorkspacePath;
          this.output_path.set('value', this.defaultPath);
        }

        this.form_flag = false;
        try {
          this.intakeRerunForm();
          if (this.form_flag) {
            this.output_file.focus();
          }
        } catch (error) {
          console.error(error);
        }

        this._started = true;
      },

      openJobsList: function () {
        Topic.publish('/navigate', { href: '/job/' });
      },

      validate: function () {
        var valid = this.inherited(arguments);
        if (valid) {
          // Additional validation for AlphaFold-specific fields
          var val = true;

          // Validate fasta paths
          if (!this.fasta_paths.get('value')) {
            val = false;
          }

          // Validate output path
          if (!this.output_path.get('value')) {
            val = false;
          }

          // Validate output file name
          if (!this.output_file.get('value')) {
            val = false;
          }

          if (val) {
            this.submitButton.set('disabled', false);
            return true;
          }
        }
        this.submitButton.set('disabled', true);
        return false;
      },

      onChangeModelPreset: function (val) {
        // Handle model preset changes if needed
        this.validate();
      },

      onChangeDatabasePreset: function (val) {
        // Handle database preset changes if needed
        this.validate();
      },

      onOutputPathChange: function (val) {
        this.inherited(arguments);
        this.validate();
      },

      checkOutputName: function () {
        this.inherited(arguments);
        this.validate();
      },

      // setLiveJob: function () {
      //   this.live_job.value = this.live_job.checked;
      // },

      getValues: function () {
        var af_values = {};
        var values = this.inherited(arguments);
        console.log('values', values);

        // Prepare submission values
        af_values.output_path = values.output_path;
        af_values.fasta_paths = values.fasta_paths;
        af_values.output_dir = '/output';
        af_values.model_preset = values.model_preset;
        af_values.data_dir = '/databases';
        af_values.db_preset = values.db_preset;
        af_values.output_file = values.output_file;

        return af_values;

        // Set job hook before submission if live job is enabled
        // if (this.live_job && this.live_job.value) {
        //   this.setJobHook(function () {
        //     Topic.publish('/navigate', { href: `/view/AlphaFold/${this.output_path.get('value')}/${this.output_file.get('value')}` });
        //   }, function (error) {
        //     console.error('Job failed:', error);
        //   });
        // }
      },

      onReset: function (evt) {
        this.inherited(arguments);
        // Reset any additional fields specific to AlphaFold
      },

      addRerunFields: function (job_params) {
        // Set fasta paths
        if (job_params.fasta_paths) {
          this.fasta_paths.set('value', job_params.fasta_paths);
        }

        // Set model preset
        if (job_params.model_preset) {
          this['model_preset'].set('value', job_params.model_preset);
        }

        // Set database preset
        if (job_params.db_preset) {
          this['db_preset'].set('value', job_params.db_preset);
        }

        // Set output path
        if (job_params.output_path) {
          this.output_path.set('value', job_params.output_path);
        }

        // Set output file
        if (job_params.output_file) {
          this.output_file.set('value', job_params.output_file);
        }
      },

      intakeRerunForm: function () {
        // Handle form rerun from session storage
        var service_fields = window.location.search.replace('?', '');
        var rerun_fields = service_fields.split('=');
        var rerun_key;

        if (rerun_fields.length > 1) {
          try {
            rerun_key = rerun_fields[1];
            var sessionStorage = window.sessionStorage;
            if (sessionStorage.hasOwnProperty(rerun_key)) {
              var param_dict = { 'output_folder': 'output_path' };
              AppBase.prototype.intakeRerunFormBase.call(this, param_dict);
              this.addRerunFields(JSON.parse(sessionStorage.getItem(rerun_key)));
              this.form_flag = true;
            }
          } catch (error) {
            console.log('Error during intakeRerunForm: ', error);
          } finally {
            if (rerun_key) {
              sessionStorage.removeItem(rerun_key);
            }
          }
        }
      }
    });
  });