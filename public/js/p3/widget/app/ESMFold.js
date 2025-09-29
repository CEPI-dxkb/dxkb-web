define([
    'dojo/_base/declare', 'dojo/_base/lang', 'dojo/_base/Deferred',
    'dojo/on', 'dojo/query', 'dojo/dom-class', 'dojo/dom-construct', 'dojo/dom-style', 'dojo/topic',
    './AppBase',
    'dojo/text!./templates/ESMFold.html', 'dijit/form/Form',
    '../../util/PathJoin', '../../WorkspaceManager', '../WorkspaceObjectSelector', '../../DataAPI'
  ], function (
    declare, lang, Deferred,
    on, query, domClass, domConstruct, domStyle, Topic,
    AppBase,
    Template, FormMixin, PathJoin, WorkspaceManager, WorkspaceObjectSelector, DataAPI
  ) {

    return declare([AppBase], {
      baseClass: 'ESMFold',
      templateString: Template,
      applicationName: 'ESMFold',
      requireAuth: true,
      applicationLabel: 'ESMFold Protein Structure Prediction',
      applicationDescription: 'Predict 3D protein structures from amino acid sequences using Meta\'s ESMFold deep learning model',
      applicationHelp: 'quick_references/services/esmfold.html',
      tutorialLink: 'tutorial/esmfold/esmfold.html',
      videoLink: 'https://youtu.be/example',
      pageTitle: 'ESMFold Service | BV-BRC',
      defaultPath: '',

      constructor: function () {
        this.paramToAttachPt = ['output_path', 'sequences', 'output_file_basename', 'num_recycles', 'chunk_size', 'max_sequence_length', 'batch_sequences', 'max_tokens_per_batch', 'use_gpu', 'cpu_offload'];
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
            this.output_file_basename.focus();
          }
        } catch (error) {
          console.error(error);
        }

        on(this.advanced, 'click', lang.hitch(this, function () {
          this.toggleAdvanced((this.advancedOptions.style.display == 'none'));
        }));

        this._started = true;
      },

      openJobsList: function () {
        Topic.publish('/navigate', { href: '/job/' });
      },

      validate: function () {
        var valid = this.inherited(arguments);
        if (valid) {
          // Additional validation for ESMFold-specific fields
          var val = true;

          // Validate sequences
          if (!this.sequences.get('value')) {
            val = false;
          }

          // Validate output path
          if (!this.output_path.get('value')) {
            val = false;
          }

          // Validate output file basename
          if (!this.output_file_basename.get('value')) {
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

      onNumRecyclesChange: function (val) {
        // Handle number of recycles changes if needed
        this.validate();
      },

      onChunkSizeChange: function (val) {
        // Handle chunk size changes if needed
        this.validate();
      },

      onMaxSequenceLengthChange: function (val) {
        // Handle max sequence length changes if needed
        this.validate();
      },

      onMaxTokensPerBatchChange: function (val) {
        // Handle max tokens per batch changes if needed
        this.validate();
      },

      onBatchSequencesChange: function (val) {
        // Handle batch processing toggle
        if (val) {
          this.max_tokens_per_batch.set('disabled', false);
        } else {
          this.max_tokens_per_batch.set('disabled', true);
        }
        this.validate();
      },

      onUseGpuChange: function (val) {
        // Handle GPU usage toggle
        this.validate();
      },

      onCpuOffloadChange: function (val) {
        // Handle CPU offloading toggle
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

      toggleAdvanced: function (flag) {
        if (flag) {
          this.advancedOptions.style.display = 'block';
          this.advancedOptionIcon.className = 'fa icon-caret-left fa-1';
        }
        else {
          this.advancedOptions.style.display = 'none';
          this.advancedOptionIcon.className = 'fa icon-caret-down fa-1';
        }
      },

      getValues: function () {
        var esmfold_values = {};
        var values = this.inherited(arguments);
        console.log('values', values);

        // Prepare submission values
        esmfold_values.output_path = values.output_path;
        esmfold_values.sequences = values.sequences;
        esmfold_values.output_file_basename = values.output_file_basename;
        esmfold_values.num_recycles = values.num_recycles;
        esmfold_values.chunk_size = values.chunk_size;
        esmfold_values.max_sequence_length = values.max_sequence_length;

        // Convert checkbox arrays to boolean values
        esmfold_values.batch_sequences = Array.isArray(values.batch_sequences) ? values.batch_sequences.length > 0 : values.batch_sequences;
        esmfold_values.max_tokens_per_batch = values.max_tokens_per_batch;
        esmfold_values.use_gpu = Array.isArray(values.use_gpu) ? values.use_gpu.length > 0 : values.use_gpu;
        esmfold_values.cpu_offload = Array.isArray(values.cpu_offload) ? values.cpu_offload.length > 0 : values.cpu_offload;

        return esmfold_values;
      },

      onReset: function (evt) {
        this.inherited(arguments);
        // Reset any additional fields specific to ESMFold
      },

      addRerunFields: function (job_params) {
        // Set sequences
        if (job_params.sequences) {
          this.sequences.set('value', job_params.sequences);
        }

        // Set output file basename
        if (job_params.output_file_basename) {
          this.output_file_basename.set('value', job_params.output_file_basename);
        }

        // Set num recycles
        if (job_params.num_recycles) {
          this.num_recycles.set('value', job_params.num_recycles);
        }

        // Set chunk size
        if (job_params.chunk_size) {
          this.chunk_size.set('value', job_params.chunk_size);
        }

        // Set max sequence length
        if (job_params.max_sequence_length) {
          this.max_sequence_length.set('value', job_params.max_sequence_length);
        }

        // Set batch sequences
        if (job_params.batch_sequences !== undefined) {
          this.batch_sequences.set('checked', Boolean(job_params.batch_sequences));
        }

        // Set max tokens per batch
        if (job_params.max_tokens_per_batch) {
          this.max_tokens_per_batch.set('value', job_params.max_tokens_per_batch);
        }

        // Set use GPU
        if (job_params.use_gpu !== undefined) {
          this.use_gpu.set('checked', Boolean(job_params.use_gpu));
        }

        // Set CPU offload
        if (job_params.cpu_offload !== undefined) {
          this.cpu_offload.set('checked', Boolean(job_params.cpu_offload));
        }

        // Set output path
        if (job_params.output_path) {
          this.output_path.set('value', job_params.output_path);
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
