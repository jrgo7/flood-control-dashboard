class Dropdown {
  constructor(labelId, dropdownId) {
    this.label = document.getElementById(labelId);
    this.dropdown = document.getElementById(dropdownId);

    this.initListeners();
  }

  initListeners() {
    this.label.addEventListener("click", (e) => {
      e.stopPropagation();
      this.dropdown.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".dropdown-container")) {
        this.dropdown.classList.remove("show");
      }
    });
  }

  populateCheckboxes(items, onChangeCallback) {
    this.dropdown.innerHTML = "";

    const clearItem = document.createElement("li");
    clearItem.className = "dropdown-item clear-item";
    clearItem.innerHTML = `<i>Clear Filters</i>`;
    clearItem.addEventListener("click", () => {
      this.dropdown.querySelectorAll("input").forEach(cb => cb.checked = false);
      onChangeCallback("clear", null);
      this.dropdown.classList.remove("show");
    });
    this.dropdown.appendChild(clearItem);

    items.forEach(item => {
      const li = document.createElement("li");
      li.className = "dropdown-item has-checkbox region-checkbox";
      li.innerHTML = `
        <label class="custom-checkbox">
          <input type="checkbox" value="${item}">
          <span class="checkmark"></span>
          <span class="label-text">${item}</span>
        </label>
      `;

      const checkbox = li.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        onChangeCallback(e.target.value, e.target.checked);
      });

      this.dropdown.appendChild(li);
    });
  }

  hookUpSortItems(onSortCallback) {
    const items = this.dropdown.querySelectorAll('.dropdown-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const value = item.getAttribute('value');
        this.label.innerText = item.innerText;
        this.dropdown.classList.remove('show');
        onSortCallback(value);
      });
    });
  }
}

export default Dropdown;
