define([
    "dojo/dom",
    "dojo/dom-style",
    "dojo/on",
    "dojo/domReady!"
], function(dom, domStyle, on) {

    function initDropdown(validIds) {
        var input = dom.byId("pdbDropdownList");
        var dropdown = dom.byId("pdbOptions");
        var errorNode = dom.byId("pdbError");

        var filtered = validIds.slice();
        var maxVisible = 20;
        var currentPage = 0;
        var highlightedIndex = -1;
        var allLiItems = [];

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
                    currentPage--;
                    renderOptions();
                    highlightedIndex = 0;
                    highlightItem(highlightedIndex);
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
                    input.value = opt;
                    input.placeholder = ""; // clear placeholder when selecting
                    domStyle.set(dropdown, "display", "none");
                    hideError();
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
                    currentPage++;
                    renderOptions();
                    highlightedIndex = 0;
                    highlightItem(highlightedIndex);
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

        // Filter options as typing (no validation yet)
        input.addEventListener("input", function() {
            filterOptions(input.value);
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
                        input.value = selectedLi.textContent;
                        input.placeholder = ""; // clear placeholder
                        domStyle.set(dropdown, "display", "none");
                        hideError();
                    }
                }
            }
        });

        // Validate only on blur
        input.addEventListener("blur", function() {
            var val = input.value.toUpperCase();
            if (val && !validIds.includes(val)) {
                showError("Invalid PDB ID");
            } else {
                hideError();
            }
        });

        // Hide dropdown on outside click
        document.addEventListener("mousedown", function(e) {
            if (!dropdown.contains(e.target) && e.target !== input) {
                domStyle.set(dropdown, "display", "none");
            }
        });
    }

    return { initDropdown };
});
