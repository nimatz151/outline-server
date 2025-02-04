/*
  Copyright 2018 The Outline Authors

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
import '@polymer/paper-button/paper-button';
import '@polymer/paper-progress/paper-progress';
import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-icons/iron-icons';
import './outline-step-view';

import {css, customElement, html, LitElement, property} from 'lit-element';

import {COMMON_STYLES} from './cloud-install-styles';
import {CloudLocationOption} from '../../model/location';
import {getShortName, localizeCountry} from '../location_formatting';

// TODO: Add more flags
const FLAG_IMAGE_DIR = 'images/flags';
const FLAG_MAPPING: {[countryCode: string]: string} = {
  'IN': `${FLAG_IMAGE_DIR}/india.png`,
  'SG': `${FLAG_IMAGE_DIR}/singapore.png`,
  'UK': `${FLAG_IMAGE_DIR}/uk.png`,
  'DE': `${FLAG_IMAGE_DIR}/germany.png`,
  'NL': `${FLAG_IMAGE_DIR}/netherlands.png`,
  'CA': `${FLAG_IMAGE_DIR}/canada.png`,
  'US': `${FLAG_IMAGE_DIR}/us.png`,
};

@customElement('outline-region-picker-step')
export class OutlineRegionPicker extends LitElement {
  @property({type: Array}) options: CloudLocationOption[] = [];
  @property({type: Number}) selectedIndex = -1;
  @property({type: Boolean}) isServerBeingCreated = false;
  @property({type: Function}) localize: (msgId: string, ...params: string[]) => string;
  @property({type: String}) language: string;

  static get styles() {
    return [COMMON_STYLES, css`
      input[type="radio"] {
        display: none;
      }
      input[type="radio"]:checked + label.city-button {
        background-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.14), 0 2px 2px 0 rgba(0, 0, 0, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        border: 1px solid var(--primary-green);
      }
      input[type="radio"] + label.city-button:hover {
        border: 1px solid var(--primary-green);
      }
      input[type="radio"] + label.city-button {
        display: inline-block;
        flex: 1;
        /* Distribute space evenly, accounting for margins, so there are always 4 cards per row. */
        min-width: calc(25% - 24px);
        position: relative;
        margin: 4px;
        text-align: center;
        border: 1px solid;
        border-color: rgba(0, 0, 0, 0);
        cursor: pointer;
        transition: 0.5s;
        background: var(--background-contrast-color);
        box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.14), 0 2px 2px 0 rgba(0, 0, 0, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }
      input[type="radio"]:disabled + label.city-button {
        /* TODO(alalama): make it look good and indicate disabled */
        filter: blur(2px);
      }
      .geo-name {
        color: var(--light-gray);
        font-size: 16px;
        line-height: 19px;
      }
      paper-button {
        background: var(--primary-green);
        color: #fff;
        text-align: center;
        font-size: 14px;
      }
      .flag {
        width: 86px;
        height: 86px;
        margin-bottom: 48px
      }
      .card-content {
        display: flex;
        flex-flow: wrap;
        padding-top: 24px;
      }
      .card-header {
        height: 24px;
        display: flex;
        justify-content: flex-end;
      }
      label.city-button {
        padding: 0 2px 24px 2px
      }
      iron-icon {
        color: var(--primary-green);
        padding: 6px 6px 0px 6px;
      }
    `];
  }

  render() {
    return html`
    <outline-step-view display-action="">
      <span slot="step-title">${this.localize('region-title')}</span>
      <span slot="step-description">${this.localize('region-description')}</span>
      <span slot="step-action">
        <paper-button id="createServerButton" @tap="${this._handleCreateServerTap}" ?disabled="${!this._isCreateButtonEnabled(this.isServerBeingCreated, this.selectedIndex)}">
          ${this.localize('region-setup')}
        </paper-button>
      </span>
      <div class="card-content" id="cityContainer">
        ${this.options.map((option, index) => {
          return html`
          <input type="radio" id="card-${index}" name="city" value="${index}" ?disabled="${!option.available}" .checked="${this.selectedIndex === index}" @change="${this._locationSelected}">
          <label for="card-${index}" class="city-button">
            <div class="card-header">
              ${this.selectedIndex === index ? html`<iron-icon icon="check-circle"></iron-icon>` : ''}
            </div>
            <img class="flag" src="${this._flagImage(option)}">
            <div class="geo-name">${getShortName(option.cloudLocation, this.localize)}</div>
            <div class="geo-name">${option.cloudLocation.location?.countryIsRedundant() ? '' :
                localizeCountry(option.cloudLocation.location, this.language)}</div>
          </label>`;
        })}
      </div>
      ${this.isServerBeingCreated ? html`<paper-progress indeterminate="" class="slow"></paper-progress>` : ''}
    </outline-step-view>
    `;
  }

  reset(): void {
    this.isServerBeingCreated = false;
    this.selectedIndex = -1;
  }

  _isCreateButtonEnabled(isCreatingServer: boolean, selectedIndex: number): boolean {
    return !isCreatingServer && selectedIndex >= 0;
  }

  _locationSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    this.selectedIndex = Number.parseInt(inputEl.value, 10);
  }

  _flagImage(item: CloudLocationOption): string {
     return FLAG_MAPPING[item.cloudLocation.location?.countryCode] || `${FLAG_IMAGE_DIR}/unknown.png`;
  }

  _handleCreateServerTap(): void {
    this.isServerBeingCreated = true;
    const selectedOption = this.options[this.selectedIndex];
    const params = {
      bubbles: true,
      composed: true,
      detail: {selectedLocation: selectedOption.cloudLocation}
    };
    const customEvent = new CustomEvent('RegionSelected', params);
    this.dispatchEvent(customEvent);
  }
}
