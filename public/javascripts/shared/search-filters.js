/*
 *  Reusable search filters version 2
 */

// Keep jslint quiet
var window = window;
var $ = $;
var facets = facets;

// Basic filter object
var SearchFilters = function SearchFilters() {
  // Convert query string parameters into an object 
  var queryString = window.location.href.split('?')[1];
  this.activeFilters = queryString ? $.deparam(queryString) : {};

  // Initialization
  this.sortFacetsByCheckedFirst();
  this.initializeFilterGroups();

  // Repopulate the keywords in the form
  var self = this, el;
  $('.keywords').each(function () { el = $(this); el.val(self.activeFilters[el.attr('name')]); });
};

// Works for me ....
var p = SearchFilters.prototype;

// Use native Javascript sort method to place checked facets first whilst maintaining count ordering
p.sortFacetsByCheckedFirst = function sortFacetsByCheckedFirst() {
  var self = this;
  Object.keys(facets).forEach(function (key) {
    // If none of this group are checked skip this step
    if (!self.activeFilters[key]) { return; }
    // Mark them once here because sort is an a + b scenario
    facets[key].terms.forEach(function (term) { term.active = self.activeFilters[key].indexOf(term.term) > -1 ? 1 : 0; });
    // Sort them
    facets[key].terms.sort(function (a, b) { return b.active - a.active || (b.count - a.count); });
  });
};

// Add checkboxes to the filter groups
p.initializeFilterGroups = function initializeFilterGroups(evt) {
  Object.keys(facets).forEach(function (key) {
    var container = $('#' + key);
    if (!container.length) {
      console.log('No matching filter markup for facet : ' + key);
      return;
    }

    var containerElement = container.get(0);
    containerElement.showMoreCount = parseInt(container.attr('data-showmore'), 10);
    containerElement.facets = facets[key];
    containerElement.ul = container.find('ul');
    // This works because NaN < XX is false
    if (containerElement.showMoreCount < facets[key].terms.length) {
      var showMoreButton = $('<a href="#" class="show-more">Show more</a>');
      container.append(showMoreButton);
      containerElement.showMoreButton = showMoreButton;
      showMoreButton.click(function (evt) {
        evt.preventDefault();
        var target = $(evt.target);
        var container = target.closest('.search-filter');
        this.showMore(container);
      }.bind(this));
    }

    // Does this filter group have any active filters? If so, make it initially open
    if (this.activeFilters[key]) { container.addClass('open'); }
    // Make the checkbox group toggleable
    container.find('h5').click(function () { $(this).parent().toggleClass('open'); });
    // Show initial checkboxes
    this.showMore(container, true);
  }, this);
};

p.showMore = function showMore(container, isInitial) {
  var name = container.attr('id');
  var el = container.get(0); // Get the raw element to access the precomputed variables
  var terms, li;

  if (isInitial && el.showMoreCount) {
    // Get the larger of all the checked ones or how many to show at a time
    terms = el.facets.terms.splice(0, Math.max(this.activeFilters[name] ? this.activeFilters[name].length : 0, el.showMoreCount));
  } else {
    // Otherwise either get all of them or the show more count
    terms = el.showMoreCount ? el.facets.terms.splice(0, el.showMoreCount) : el.facets.terms;
  }

  terms.forEach(function (term) {
    li = $('<li><label><input type="checkbox" name="' + name + '[]" value="' + term.term + '"' + (term.active ? ' checked ' : '') + '/>' + term.term + ' (' + term.count + ')' + '</label></li>');
    el.ul.append(li);
  }, this);

  // Hide the show more button if we have one and we're out of more
  if (el.showMoreButton && !el.facets.terms.length) { el.showMoreButton.hide(); }
}

$('#clear-filters').click(function(evt) {
  evt.preventDefault();
  $('form#search').find(':checked').attr("checked", false);
});

// Populate and show the search filters 
new SearchFilters();
