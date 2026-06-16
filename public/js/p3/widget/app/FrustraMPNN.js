define([
  'dojo/_base/declare', 'dojo/_base/array', 'dojo/topic', 'dijit/_WidgetBase', 'dojo/on', 'dojo/dom', 'dojo/dom-style',
  'dojo/fx/Toggler',
  'dojo/dom-class', 'dijit/_TemplatedMixin', 'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./templates/FrustraMPNN.html', './AppBase',
  'dojo/_base/lang', '../../WorkspaceManager', './rcsbList', 'dijit/registry', "dojo/domReady!"
], function (
  declare, array, Topic, WidgetBase, on, dom, domStyle,
  Toggler,
  domClass, Templated, WidgetsInTemplate,
  Template, AppBase, lang, WorkspaceManager, rcsbList, registry
) {
    return declare([AppBase], {
    baseClass: 'FrustraMPNN',
    _validPDBCode: false,
    templateString: Template,
    applicationName: 'FrustraMPNN',
    requireAuth: true,
    applicationLabel: 'FrustraMPNN',
    applicationDescription: 'The FrustraMPNN Service predicts frustration given a PDB structure.',
    applicationHelp: 'quick_references/services/frustraMPNN_service.html',
    tutorialLink: 'tutorial/frustraMPNN/frustraMPNN.html',
    videoLink: '',
    pageTitle: 'FrustraMPNN Service | BV-BRC',
    required: true,
    code_four: false,
    defaultPath: '',

    constructor: function () {
      this._autoTaxSet = false;
      this._autoNameSet = false;
    },

    startup: function () {
      var _self = this;

      if (this._started) { return; }
      this.inherited(arguments);
      if (this.requireAuth && (window.App.authorizationToken === null || window.App.authorizationToken === undefined)) {
        return;
      }
      _self.defaultPath = WorkspaceManager.getDefaultFolder() || _self.activeWorkspacePath;
      _self.output_path.set('value', _self.defaultPath);
      this.form_flag = false;

      rcsbList.getEntryIds().then(function(ids) {
          if (_self._destroyed) { return; }
          _self._validPdbIds = ids;
          _self.initDropdown(ids);
        }, function(err) {
          console.error("Error fetching PDB IDs:", err);
        });

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
      this.checkParameterRequiredFields();
    },

    onProteinInputChange: function (evt) {
      this.protein_databank_selection

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

      if (this.protein_databank_selection.checked) {
        this.protein_databank_selection.value = "input_pdb";
      }
      else if (this.user_pdb_file.checked) {
        this.protein_databank_selection.value = "user_pdb_file";
      }
      this.checkParameterRequiredFields();
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
      var submit_values = {
        output_path: values.output_path,
        output_file: values.output_file,
        chains: values.chains,
        weights: values.weights,
      }
      if (values.protein_input === "input_pdb")
      {
        submit_values.protein_input_type = "input_pdb";
        submit_values.input_pdb = values.pdbDropdownList;
      }
      else if (values.protein_input === "user_pdb_file")
      {
        submit_values.protein_input_type = "user_pdb_file";
        submit_values.user_pdb_file = values.user_pdb;
      }

      return submit_values;
    },

    checkParameterRequiredFields: function () {

      if (this._pagingDropdown) return;

      var submitButton = this.submitButton;

      var pdb_choice = this.protein_databank_selection.value;
      var validPdb;

      setTimeout(() => {
        if (pdb_choice === 'input_pdb'){
            if (this.value.pdbDropdownList && this._validPDBCode) {
              validPdb = true;
            }
            else {
              validPdb = false;
            }
        }
        else if (pdb_choice === 'user_pdb_file'){
          if (this.user_pdb.value) {
            validPdb = true;
          }
          else {
            validPdb = false;
          }
        }
        if (validPdb &&
          this.output_path.get('value') &&
          this.output_file.get('displayedValue')
        ) {
          if (this.submitButton) {
            this.submitButton.set('disabled', false);
          }
        } else {
          if (this.submitButton) {
            this.submitButton.set('disabled', true);
          }
        }
      }, 100);
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
        var inputEl = dom.byId('pdbDropdownList');
        if (inputEl) {
          inputEl.value = job_params['input_pdb'];
          this._validPDBCode = true;
        }
      }
      else {
        console.log( 'Invalid protein input');
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
            this.addRerunFields(JSON.parse(sessionStorage.getItem(rerun_key)));
            this.form_flag = true;
          } catch (error) {
            console.log('Error during intakeRerunForm: ', error);
          } finally {
            sessionStorage.removeItem(rerun_key);
          }
        }
      }
    },

    // This was pulled in from a separate file so that the dom elements can talk to each other all in here.
    initDropdown: function(validIds) {
        const self = this;

        var input = dom.byId("pdbDropdownList");
        var inputWidget = registry.byId("pdbDropdownList");
        var dropdown = dom.byId("pdbOptions");
        var errorNode = dom.byId("pdbError");

        var filtered = validIds.slice();
        var maxVisible = 20;
        var currentPage = 0;
        var highlightedIndex = -1;
        var allLiItems = [];

        self._pagingDropdown = false;

        function showError(msg) {
            domStyle.set(errorNode, "display", "block");
            errorNode.innerHTML = msg;
            input.style.borderColor = "red";
        }

        function hideError() {
            domStyle.set(errorNode, "display", "none");
            input.style.borderColor = "";
        }

        function filterOptions(value) {
          if (self._pagingDropdown) return;

          var valUpper = value.toUpperCase();
          filtered = validIds.filter(id => id.startsWith(valUpper));
          currentPage = 0;
          highlightedIndex = -1;
          renderOptions();
        }

        function renderOptions() {
            dropdown.innerHTML = "";
            allLiItems = [];

            if (filtered.length === 0) {
                domStyle.set(dropdown, "display", "none");
                return;
            }

            domStyle.set(dropdown, "display", "block");

            var start = currentPage * maxVisible;
            var end = Math.min(start + maxVisible, filtered.length);
            var pageItems = filtered.slice(start, end);

            // Previous options
            if (currentPage > 0) {
                var prevLi = document.createElement("li");
                prevLi.textContent = "Previous options";
                prevLi.style.padding = "4px";
                prevLi.style.cursor = "pointer";
                prevLi.style.fontStyle = "italic";
                prevLi.addEventListener("mousedown", function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    self._pagingDropdown = true;

                    currentPage--;
                    renderOptions();
                    highlightedIndex = 0;
                    highlightItem(highlightedIndex);

                    setTimeout(() => {
                      self._pagingDropdown = false;
                    }, 0);
                });
                dropdown.appendChild(prevLi);
                allLiItems.push(prevLi);
            }

            // Page items
            pageItems.forEach(function(opt) {
                var li = document.createElement("li");
                li.textContent = opt;
                li.style.padding = "4px";
                li.style.cursor = "pointer";
                li.addEventListener("mousedown", function() {
                input._suppressValidation = true;
                inputWidget.set('value', opt);
                setTimeout(() => {
                  input._suppressValidation = false;
                }, 0);
                    input.placeholder = "";
                    domStyle.set(dropdown, "display", "none");
                    self._validPDBCode = true;
                    hideError();
                    self.checkParameterRequiredFields();
                });
                dropdown.appendChild(li);
                allLiItems.push(li);
            });

            // Next options
            if (end < filtered.length) {
                var nextLi = document.createElement("li");
                nextLi.textContent = "Next options";
                nextLi.style.padding = "4px";
                nextLi.style.cursor = "pointer";
                nextLi.style.fontStyle = "italic";
                nextLi.addEventListener("mousedown", function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    self._pagingDropdown = true;

                    currentPage++;
                    renderOptions();
                    highlightedIndex = 0;
                    highlightItem(highlightedIndex);

                    setTimeout(() => {
                      self._pagingDropdown = false;
                    }, 0);
                });
                dropdown.appendChild(nextLi);
                allLiItems.push(nextLi);
            }
        }

        function highlightItem(index) {
            allLiItems.forEach((li, i) => {
                li.style.background = i === index ? "#bde4ff" : "";
            });

            if (index >= 0 && allLiItems[index]) {
                var li = allLiItems[index];
                var liRect = li.getBoundingClientRect();
                var dropdownRect = dropdown.getBoundingClientRect();

                if (liRect.bottom > dropdownRect.bottom) {
                    dropdown.scrollTop += liRect.bottom - dropdownRect.bottom;
                } else if (liRect.top < dropdownRect.top) {
                    dropdown.scrollTop -= dropdownRect.top - liRect.top;
                }
            }
        }

        // Show first page immediately on focus
        input.addEventListener("focus", function() {
            filterOptions('');
        });

        input.addEventListener("input", function () {
            if (self._pagingDropdown) return;

            var value = input.value;

            filterOptions(value);

            var val = value.toUpperCase();
            if (val && !validIds.includes(val)) {
                showError("Invalid PDB ID");
                self._validPDBCode = false;
            } else {
                hideError();
                self._validPDBCode = true;
            }

            self.checkParameterRequiredFields();
        });

        input.addEventListener("keydown", function(e) {
            if (domStyle.get(dropdown,"display")==="none") return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                if (highlightedIndex < allLiItems.length - 1) {
                    highlightedIndex++;
                    highlightItem(highlightedIndex);
                }
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (highlightedIndex > 0) {
                    highlightedIndex--;
                    highlightItem(highlightedIndex);
                }
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (highlightedIndex >= 0 && allLiItems[highlightedIndex]) {
                    var selectedLi = allLiItems[highlightedIndex];
                    if (selectedLi.textContent === "Next options") {
                        currentPage++;
                        renderOptions();
                        highlightedIndex = 0;
                        highlightItem(highlightedIndex);
                    } else if (selectedLi.textContent === "Previous options") {
                        currentPage--;
                        renderOptions();
                        highlightedIndex = 0;
                        highlightItem(highlightedIndex);
                    } else {
                        inputWidget.set('value', selectedLi.textContent);
                        input.placeholder = "";
                        domStyle.set(dropdown, "display", "none");
                        self._validPDBCode = true;
                        hideError();
                    }
                }
            }
            self.checkParameterRequiredFields();
        });

        // Validate on blur
        input.addEventListener("blur", function() {
          if (input._suppressValidation) return;

          var val = input.value.toUpperCase();
          if (val && !validIds.includes(val)) {
              showError("Invalid PDB ID");
              self._validPDBCode = false;
          } else {
              hideError();
              self._validPDBCode = true;
          }
          self.checkParameterRequiredFields();
        });

        // Hide dropdown on outside mousedown
        document.addEventListener("mousedown", function(e) {
            if (!dropdown.contains(e.target) && e.target !== input) {
                domStyle.set(dropdown, "display", "none");
            }
        });
    }

  });
});
