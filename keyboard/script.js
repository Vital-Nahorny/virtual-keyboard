const input = document.querySelector('.use-keyboard-input');

let isRecognition = false;
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognizer = new SpeechRecognition();

recognizer.addEventListener("result", function(e) {
  let text = "";
    text = Array.from(e.results)
    .map(result => result[0])
    .map(result => result.transcript)
    .join('');

    if (e.results[0].isFinal) {
  Keyboard.properties.value += ` ${text}`;
    };
  Keyboard._triggerEvent("oninput");
  Keyboard.properties.start++;
  Keyboard.properties.end++;
  input.focus();
});


const Keyboard = {
  elements: {
    main: null,
    keysContainer: null,
    keys: []
  },

  eventHandlers: {
    oninput: null,
    onclose: null
  },

  properties: {
    value: "",
    sound: true,
    rec: false,
    capsLock: false,
    eng: true,
    shift: false,
    start: 0,
    end: 0,
  },

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
    this.elements.main.innerHTML = "<audio data-key='symbol-en' src='./assets/sounds/click-en.mp3'></audio><audio data-key='symbol-ru' src='./assets/sounds/click_ru.mp3'></audio><audio data-key='enter' src='./assets/sounds/enter.mp3'></audio><audio data-key='shift' src='./assets/sounds/shift.mp3'></audio><audio data-key='back' src='./assets/sounds/back.mp3'></audio><audio data-key='caps' src='./assets/sounds/caps.mp3'>";
    this.elements.main.appendChild(this.elements.keysContainer);
    document.body.appendChild(this.elements.main);

    // Automatically use keyboard for elements with .use-keyboard-input
    document.querySelectorAll(".use-keyboard-input").forEach(element => {
      element.addEventListener("focus", () => {
        this.open(element.value, currentValue => {
          element.value = currentValue;
        });
      });

      //Position cursor
      element.addEventListener('click', () => {
        this.properties.start = input.selectionStart;
        this.properties.end = input.selectionEnd;
      });

      //Insert from  keyboard
      element.addEventListener("keypress", key => {
        this.properties.value += key.key;
        this.open(element.value, currentValue => {
          if (this.properties.start > element.value.length) {
            element.value += currentValue.substring(currentValue.length - 1, currentValue.length);
          }
          else {
            element.value = element.value.substring(0, this.properties.start - 1)
              + currentValue.substring(this.properties.start - 1, this.properties.end)
              + element.value.substring(this.properties.end - 1, element.value.length);
          }
        });
        this.properties.start++;
        this.properties.end++;
      });

      element.addEventListener('keydown', key => {
        //Arrows left right
        if (key.which === 37) {
          this.properties.start--;
          this.properties.end--;
        }
        if (key.which === 39) {
          this.properties.start++;
          this.properties.end++;
        }
        //Insert backspace
        if (key.which === 8) {
          setTimeout(() => {
            this.properties.value = input.value;
          }, 50);
        }
      });
    });

    //Illumination of keys of the virtual keyboard when clicking on the keys of the physical keyboard 

    document.addEventListener('keydown', function (e) {
      // document.getElementById(e.code).click();
      if (e.code === 'CapsLock') {
        document.getElementById('CapsLock').click();
      };
      if (e.code === 'ShiftLeft') {
        document.getElementById('ShiftLeft').click();
      };
      const key = document.getElementById(e.code);
      key.classList.add('keyboard__key-keydown');
    });

    document.addEventListener('keyup', function (e) {

      const key = document.getElementById(e.code);
      key.classList.remove('keyboard__key-keydown');
    });
  },



  _createKeys() {
    const fragment = document.createDocumentFragment();

    let keyLayout;

    // Creates HTML for an icon
    const createIconHTML = (icon_name) => {
      return `<i class="material-icons">${icon_name}</i>`;
    };

    //Check lang before create
    if (this.properties.eng) {
      keyLayout = en;
    }
    else {
      keyLayout = ru;
    }

    keyLayout.forEach(key => {
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
            if (this.properties.sound) {
              document.querySelector(`audio[data-key="back"]`).play();
            };

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
          if (this.properties.capsLock) {
            keyElement.classList.toggle("keyboard__key--active");
          }

          keyElement.addEventListener("click", () => {
            if (this.properties.sound) {
              document.querySelector(`audio[data-key="caps"]`).play();
            };

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

            if (this.properties.sound) {
              document.querySelector(`audio[data-key="enter"]`).play();
            };

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

          if (this.properties.rec)  {
            keyElement.classList.toggle("keyboard__key--active");
            keyElement.innerHTML = createIconHTML("mic");
            } else {
              keyElement.innerHTML = createIconHTML("mic_off");
              
            };
        

          keyElement.addEventListener("click", () => {
            let audioKey = this.properties.eng ? "symbol-en" : "symbol-ru";
            if (this.properties.sound) {
              document.querySelector(`audio[data-key=${audioKey}]`).play();
            };

            this.properties.rec = !this.properties.rec;
            keyElement.classList.toggle("keyboard__key--active", this.properties.rec);
            if (this.properties.rec)  {
              keyElement.innerHTML = createIconHTML("mic");
              } else {
                keyElement.innerHTML = createIconHTML("mic_off");
              };
            
            //Check language for recognizer
            if (Keyboard.properties.eng) {
                recognizer.lang = 'en-En';
              } else {
                recognizer.lang = 'ru-Ru';
              };

            //Start recognizer and stop
            if (this.properties.rec) {
              recognizer.addEventListener("end", recognizer.start);
              recognizer.start();
            } else {
              recognizer.abort();
              recognizer.stop();
              recognizer.removeEventListener("end", recognizer.start);
            };
            input.focus();
          });

          break;

        case "Space":
          keyElement.classList.add("keyboard__key--extra-wide");
          keyElement.id = key.code;
          keyElement.innerHTML = createIconHTML("space_bar");

          keyElement.addEventListener("click", () => {
            let audioKey = this.properties.eng ? "symbol-en" : "symbol-ru";
            if (this.properties.sound) {
              document.querySelector(`audio[data-key=${audioKey}]`).play();
            };

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
            let audioKey = this.properties.eng ? "symbol-en" : "symbol-ru";
            if (this.properties.sound) {
              document.querySelector(`audio[data-key=${audioKey}]`).play();
            };

            this.properties.sound = !this.properties.sound;
            keyElement.innerHTML = this.properties.sound ? createIconHTML("volume_up") : createIconHTML("volume_off");
          });

          break;


        case "done":
          keyElement.classList.add("keyboard__key--wide", "keyboard__key--dark");
          keyElement.innerHTML = createIconHTML("check_circle");

          keyElement.addEventListener("click", () => {
            let audioKey = this.properties.eng ? "symbol-en" : "symbol-ru";
            if (this.properties.sound) {
              document.querySelector(`audio[data-key=${audioKey}]`).play();
            };

            this.close();
            this._triggerEvent("onclose");
          });

          break;

        case "ShiftLeft":
          keyElement.id = key.code;
          keyElement.classList.add("keyboard__key--wide", "keyboard__key--activatable");
          keyElement.innerHTML = createIconHTML("arrow_upward");
          if (this.properties.shift) {
            keyElement.classList.toggle("keyboard__key--active");
          };

          keyElement.addEventListener("click", () => {

            if (this.properties.sound) {
              document.querySelector(`audio[data-key="shift"]`).play();
            };

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
            keyElement.classList.toggle("keyboard__key--active", this.properties.shift);
            input.focus();
          });

          break;



        case "en/ru":
          keyElement.classList.add("keyboard__key--wide");
          keyElement.textContent = key.content;

          keyElement.addEventListener('click', () => {

            this.properties.eng = !this.properties.eng;

            let audioKey = this.properties.eng ? "symbol-en" : "symbol-ru";
            if (this.properties.sound) {
              document.querySelector(`audio[data-key=${audioKey}]`).play();
            };

            //Clear keys
            this.elements.keysContainer.innerHTML = '';
            //Add new keys

            this.elements.keysContainer.appendChild(this._createKeys());
            this.elements.keys = this.elements.keysContainer.querySelectorAll(".keyboard__key");
          });

          break;

        case "ArrowLeft":
          keyElement.id = key.code;
          keyElement.classList.add("keyboard__key--wide");
          keyElement.innerHTML = createIconHTML("arrow_left");

          keyElement.addEventListener("click", () => {
            let audioKey = this.properties.eng ? "symbol-en" : "symbol-ru";
            if (this.properties.sound) {
              document.querySelector(`audio[data-key=${audioKey}]`).play();
            };

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
            let audioKey = this.properties.eng ? "symbol-en" : "symbol-ru";
            if (this.properties.sound) {
              document.querySelector(`audio[data-key=${audioKey}]`).play();
            };

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
            let audioKey = this.properties.eng ? "symbol-en" : "symbol-ru";
            if (this.properties.sound) {
              document.querySelector(`audio[data-key=${audioKey}]`).play();
            };

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
  },

  _triggerEvent(handlerName) {
    if (typeof this.eventHandlers[handlerName] == "function") {
      this.eventHandlers[handlerName](this.properties.value);
    }
  },

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
  },

  open(initialValue, oninput, onclose) {
    this.properties.value = initialValue || "";
    this.eventHandlers.oninput = oninput;
    this.eventHandlers.onclose = onclose;
    this.elements.main.classList.remove("keyboard--hidden");
  },

  close() {
    this.properties.value = "";
    this.eventHandlers.oninput = oninput;
    this.eventHandlers.onclose = onclose;
    this.elements.main.classList.add("keyboard--hidden");
  }
};

window.addEventListener("DOMContentLoaded", function () {
  Keyboard.init();
});
