import {en} from './en.js';
import {ru} from './ru.js';

const input = document.querySelector('.use-keyboard-input');

class Keyboard  {
  constructor() {
    this.elements = {
      main: null,
      keysContainer: null,
      keys: [],
      audio: null,
      keyLayout: null,
      recognizer: null,
    },
  
    this.eventHandlers = {
      oninput: null,
      onclose: null
    },
  
    this.properties = {
      value: "",
      sound: true,
      rec: false,
      capsLock: false,
      eng: true,
      shift: false,
      start: 0,
      end: 0,
    }
  }
  

  init() {
    // Create main elements
    this.elements.main = document.createElement("div");
    this.elements.keysContainer = document.createElement("div");

    // Setup main elements
    this.elements.main.classList.add("keyboard", "keyboard--hidden");
    this.elements.keysContainer.classList.add("keyboard__keys");
    this.elements.keysContainer.appendChild(this._createKeys());
    this.elements.keys = this.elements.keysContainer.querySelectorAll(".keyboard__key");

    // Add to DOM
    this.elements.main.appendChild(this.elements.keysContainer);
    document.body.appendChild(this.elements.main);

    this._subscribeEventListeners();
    this._initSpeechRecognition();
  }

  _subscribeEventListeners() {
    input.addEventListener("focus", () => {
      this.open(input.value, (currentValue) => {
        input.value = currentValue;
      });
    });

    //Position cursor
    input.addEventListener('click', () => {
      this.properties.start = input.selectionStart;
      this.properties.end = input.selectionEnd;
    });

    //Insert from  keyboard
    input.addEventListener("keypress", (e) => {
      //Arrows left right
      if (e.code === 'ArrowLeft') {
        this.properties.start--;
        this.properties.end--;
      } 
      //Insert backspace
      if (e.code === 'Backspace') {
          this.properties.value = input.value;
      }
      //Insert capsLock
      if (e.code === 'CapsLock') {
        document.getElementById('CapsLock').click();
      };
      //Insert leftShift
      if (e.code === 'ShiftLeft') {
        document.getElementById('ShiftLeft').click();
      };

      this.properties.value += e.key;
      this.open(input.value, (currentValue) => {
        if (this.properties.start > input.value.length) {
          input.value += currentValue.substring(currentValue.length - 1, currentValue.length);
        }
        else {
          input.value = input.value.substring(0, this.properties.start - 1)
            + currentValue.substring(this.properties.start - 1, this.properties.end)
            + input.value.substring(this.properties.end - 1, input.value.length);
        }
      });
      this.properties.start++;
      this.properties.end++;
    });

    input.addEventListener('keydown', (e) => {
      const key = document.getElementById(e.code);
      key.classList.add('keyboard__key-keydown');
    });
    
    input.addEventListener('keyup', (e) => {
      const key = document.getElementById(e.code);
      key.classList.remove('keyboard__key-keydown');
    });

    
  }

  _initSpeechRecognition() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognizer = new SpeechRecognition();
    this.elements.recognizer = recognizer;
    recognizer.addEventListener('result', (e) => {
      let text = '';
        text = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
    
        if (e.results[0].isFinal) {
          this.properties.value += ` ${text}`;
        };
        this._triggerEvent('oninput');
        this.properties.start++;
        this.properties.end++;
        input.focus();
    });
  }


  _createKeys() {
    const fragment = document.createDocumentFragment();

    // Creates HTML for an icon
    const createIconHTML = (icon_name) => {
      return `<i class="material-icons">${icon_name}</i>`;
    };

    //Check lang before create
    this.elements.keyLayout = this.properties.eng ? en : ru;

    this.elements.keyLayout.forEach(key => {
      const keyElement = document.createElement("button");
      const insertLineBreak = ["Backspace", "Backslash", "Enter", "Slash"].indexOf(key.code) !== -1;

      // Add attributes/classes
      keyElement.setAttribute("type", "button");
      keyElement.classList.add("keyboard__key");

      switch (key.code) {
        case "Backspace":
          keyElement.id = key.code;
          keyElement.classList.add("keyboard__key--wide");
          keyElement.innerHTML = createIconHTML("backspace");

          keyElement.addEventListener("click", () => {
            this._playSound('back');

            if (this.properties.start !== this.properties.end) {
              this.properties.value = this.properties.value.substring(0, this.properties.start)
                + this.properties.value.substring(this.properties.end, this.properties.value.length);
            }
            else
              this.properties.value = this.properties.value.substring(0, this.properties.start - 1)
                + this.properties.value.substring(this.properties.end, this.properties.value.length);
            this._triggerEvent("oninput");
            this.properties.start--;
            this.properties.end--;
            input.setSelectionRange(this.properties.start, this.properties.end);
            input.focus();
          });

        break;

        case "CapsLock":
          keyElement.id = key.code;
          keyElement.classList.add("keyboard__key--wide", "keyboard__key--activatable");
          keyElement.innerHTML = createIconHTML("keyboard_capslock");
          keyElement.classList.toggle("keyboard__key--active", this.properties.capsLock);

          keyElement.addEventListener("click", () => {
            this._playSound('caps');
            this._toggleCapsLock();
            keyElement.classList.toggle("keyboard__key--active", this.properties.capsLock);
            input.focus();
          });

        break;

        case "Enter":
          keyElement.id = key.code;
          keyElement.classList.add("keyboard__key--wide");
          keyElement.innerHTML = createIconHTML("keyboard_return");

          keyElement.addEventListener("click", () => {
            this._playSound('enter');

            this.properties.value = this.properties.value.substring(0, this.properties.start) + "\n" + this.properties.value.substring(this.properties.end, this.properties.value.length);
            this.properties.start++;
            this.properties.end++;
            this._triggerEvent("oninput");
            input.focus();
            input.setSelectionRange(this.properties.start, this.properties.end);
          });

        break;

        case "Rec":
          keyElement.classList.add("keyboard__key--wide", "keyboard__key--activatable");
          keyElement.classList.toggle("keyboard__key--active", this.properties.rec);
          keyElement.innerHTML = this.properties.rec ? createIconHTML("mic") : createIconHTML("mic_off");

          keyElement.addEventListener("click", () => {
            const audioKey = this.properties.eng ? 'click-en' : 'click-ru';
            this.properties.rec = !this.properties.rec;
            keyElement.classList.toggle("keyboard__key--active", this.properties.rec);
            keyElement.innerHTML = this.properties.rec ? createIconHTML("mic") : createIconHTML("mic_off");
            this._playSound(audioKey);
            this._toggleSpeechRecognition();
            input.focus();
          });

        break;

        case "Space":
          keyElement.classList.add("keyboard__key--extra-wide");
          keyElement.id = key.code;
          keyElement.innerHTML = createIconHTML("space_bar");

          keyElement.addEventListener("click", () => {
            let audioKey = this.properties.eng ? "click-en" : "click-ru";
            this._playSound(audioKey);

            this.properties.value = this.properties.value.substring(0, this.properties.start) + ' ' + this.properties.value.substring(this.properties.end, this.properties.value.length);
            this.properties.start++;
            this.properties.end++;
            this._triggerEvent("oninput");
            input.setSelectionRange(this.properties.start, this.properties.end);
            input.focus();
          });

        break;

        case "mute":
          keyElement.classList.add("keyboard__key--wide");
          keyElement.innerHTML = this.properties.sound ? createIconHTML("volume_up") : createIconHTML("volume_off");

          keyElement.addEventListener("click", () => {
            this.properties.sound = !this.properties.sound;
            let audioKey = this.properties.eng ? "click-en" : "click-ru";
            this._playSound(audioKey);
            keyElement.innerHTML = this.properties.sound ? createIconHTML("volume_up") : createIconHTML("volume_off");
          });
        break;


        case "done":
          keyElement.classList.add("keyboard__key--wide", "keyboard__key--dark");
          keyElement.innerHTML = createIconHTML("check_circle");

          keyElement.addEventListener("click", () => {
            let audioKey = this.properties.eng ? "click-en" : "click-ru";
            this._playSound(audioKey);
            this.close();
            this._triggerEvent("onclose");
          });
        break;

        case "ShiftLeft":
          keyElement.id = key.code;
          keyElement.classList.add("keyboard__key--wide", "keyboard__key--activatable");
          keyElement.innerHTML = createIconHTML("arrow_upward");
          keyElement.classList.toggle("keyboard__key--active", this.properties.shift);

          keyElement.addEventListener("click", () => {
            this._playSound('shift');
            this._toggleShift();
            keyElement.classList.toggle("keyboard__key--active", this.properties.shift);
            input.focus();
          });
        break;

        case "en/ru":
          keyElement.classList.add("keyboard__key--wide");
          keyElement.textContent = key.content;

          keyElement.addEventListener('click', () => {
            this.properties.eng = !this.properties.eng;
            let audioKey = this.properties.eng ? "click-en" : "click-ru";
            this._playSound(audioKey);
            this._changeLanguage();
          });
        break;

        case "ArrowLeft":
          keyElement.id = key.code;
          keyElement.classList.add("keyboard__key--wide");
          keyElement.innerHTML = createIconHTML("arrow_left");

          keyElement.addEventListener("click", () => {
            let audioKey = this.properties.eng ? "click-en" : "click-ru";
            this._playSound(audioKey);

            this.properties.start--;
            this.properties.end--;
            input.setSelectionRange(this.properties.start, this.properties.end);
            input.focus();
          });
        break;

        case "ArrowRight":
          keyElement.id = key.code;
          keyElement.classList.add("keyboard__key--wide");
          keyElement.innerHTML = createIconHTML("arrow_right");

          keyElement.addEventListener("click", () => {
            let audioKey = this.properties.eng ? "click-en" : "click-ru";
            this._playSound(audioKey);
            this.properties.start++;
            this.properties.end++;
            input.setSelectionRange(this.properties.start, this.properties.end);
            input.focus();
          });
        break;

        default:
          keyElement.id = key.code;
          if (this.properties.shift) {
            keyElement.textContent = this.properties.capsLock ? key.shift.toLowerCase() : key.shift;
          } else {
            keyElement.textContent = this.properties.capsLock ? key.content.toUpperCase() : key.content;
          };

          keyElement.addEventListener("click", () => {
            let audioKey = this.properties.eng ? "click-en" : "click-ru";
              this._playSound(audioKey);

            let str;
            if (this.properties.shift) {
              str = this.properties.capsLock ? key.shift.toLowerCase() : key.shift;
            } else {
              str = this.properties.capsLock ? key.content.toUpperCase() : key.content;
            };

            this.properties.value = this.properties.value.substring(0, this.properties.start) + str + this.properties.value.substring(this.properties.end, this.properties.value.length);
            this.properties.start++;
            this.properties.end++;
            this._triggerEvent("oninput");
            input.setSelectionRange(this.properties.start, this.properties.end);
            input.focus();
          });
        break;
      }

      fragment.appendChild(keyElement);

      if (insertLineBreak) {
        fragment.appendChild(document.createElement("br"));
      }
    });

    return fragment;
  }

  _playSound(audioKey) {
    if (!this.properties.sound) return;
    if (!this.elements.audio) {
      this.elements.audio = new Audio();
    }
    this.elements.audio.src = `./assets/sounds/${audioKey}.mp3`;
    this.elements.audio.play();
  }

  _triggerEvent(handlerName) {
    if (typeof this.eventHandlers[handlerName] == "function") {
      this.eventHandlers[handlerName](this.properties.value);
    }
  }

  _changeLanguage() {
    this.elements.keysContainer.innerHTML = '';
    this.elements.keysContainer.appendChild(this._createKeys());
    this.elements.keys = this.elements.keysContainer.querySelectorAll(".keyboard__key");
  }

  _toggleSpeechRecognition() {
    //Check language for recognizer
    this.elements.recognizer.lang = this.properties.eng ? 'en-En' : 'ru-Ru';
    //Start recognizer and stop
    if (this.properties.rec) {
      this.elements.recognizer.addEventListener("end", this.elements.recognizer.start);
      this.elements.recognizer.start();
    } else {
      this.elements.recognizer.abort();
      this.elements.recognizer.stop();
      this.elements.recognizer.removeEventListener("end", this.elements.recognizer.start);
    };
  }

  _toggleCapsLock() {
    this.properties.capsLock = !this.properties.capsLock;

    for (const key of this.elements.keys) {
      if (key.childElementCount === 0 && key.textContent !== "EN" && key.textContent !== "RU") {
        if (this.properties.shift) {
          key.textContent = this.properties.capsLock ? key.textContent.toLowerCase() : key.textContent.toUpperCase();
        } else {
          key.textContent = this.properties.capsLock ? key.textContent.toUpperCase() : key.textContent.toLowerCase();
        }

      }
    }
  }

  _toggleShift() {
    const keyLayout = this.elements.keyLayout;
    this.properties.shift = !this.properties.shift;
    for (const key of this.elements.keys) {
      if (key.childElementCount === 0 && key.textContent !== "EN" && key.textContent !== "RU") {
        for (let i = 0; i < keyLayout.length; i++) {
          if (keyLayout[i].content === key.textContent || keyLayout[i].shift === key.textContent) {
            if (this.properties.capsLock) {
              key.textContent = this.properties.shift ? keyLayout[i].shift.toLowerCase() : keyLayout[i].content.toUpperCase();
            } else {
              key.textContent = this.properties.shift ? keyLayout[i].shift : keyLayout[i].content;
            }
          };
        }
      }
    }
  }

  open(initialValue, oninput, onclose) {
    this.properties.value = initialValue || "";
    this.eventHandlers.oninput = oninput;
    this.eventHandlers.onclose = onclose;
    this.elements.main.classList.remove("keyboard--hidden");
  }

  close() {
    this.properties.value = "";
    this.eventHandlers.oninput = oninput;
    this.eventHandlers.onclose = onclose;
    this.elements.main.classList.add("keyboard--hidden");
  }
};

const virtualKeyboard = new Keyboard();

window.addEventListener("DOMContentLoaded", function () {
  virtualKeyboard.init();
});
