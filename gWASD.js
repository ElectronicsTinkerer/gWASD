
window.onload = () => {
    
    document.getElementById("scale").value = 1;
    if (typeof(Storage) !== "undefined") {
        if (localStorage.gWASD) {
        document.getElementById("source").value = localStorage.gWASD;
        }
        if (localStorage.scale) {
            document.getElementById("scale").value = localStorage.scale;
        }
        // if (localStorage.debug) {
        //     document.getElementById("debug").checked = (localStorage.debug == "true");
        // }
        document.getElementById("save-button").style.display = "inline";    // Only show if local saving is possible
    } 
}

const save = () => {
    // Save code
    if (typeof (Storage) !== "undefined") {
        localStorage.gWASD = document.getElementById("source").value.trim();
        localStorage.scale = document.getElementById("scale").value;
        // localStorage.debug = document.getElementById("debug").checked;
        console.log("Saved");
    }
}

// Allows run() to run (used by the "Stop" button)
let stopImageRender = true;

const stopRender = () => {
    stopImageRender = true;
}

// Used to only let run() have one instance
let renderLock = false;

async function startRender() {
    if (renderLock) {
        return;
    }
    if (stopImageRender === false) {
        renderLock = true;
        stopImageRender = true;
        await new Promise(delay => setTimeout(delay, 500));  // Hopefully a frame will not take longer than 500 ms
    }
    renderLock = false;
    stopImageRender = false;
    save();
    run();
}

// Colors
const colors = [[0x00, 0x00, 0x00], // Black
                [0x00, 0x00, 0xAA], // Blue
                [0x00, 0xAA, 0x00], // Green
                [0x00, 0xAA, 0xAA], // Cyan
                [0xAA, 0x00, 0x00], // Red
                [0xAA, 0x55, 0x00], // Brown
                [0xAA, 0xAA, 0xAA], // Light grey
                [0x55, 0x55, 0x55], // Dark grey
                [0x55, 0x55, 0xFF], // Bright blue
                [0x55, 0xFF, 0x55], // Bright green
                [0x55, 0xFF, 0xFF], // Bright cyan
                [0xFF, 0x55, 0x55], // Bright red
                [0xFF, 0x55, 0xFF], // Bright magenta
                [0xFF, 0xFF, 0x55], // Bright yellow
                [0xFF, 0xFF, 0xFF]];// White

// Good resource: https://rembound.com/articles/drawing-pixels-with-html5-canvas-and-javascript
const run = () => {

    // Get output location
    let canvas = document.getElementById("viewport");
    let source = document.getElementById("source").value.trim();
    let context = canvas.getContext("2d");

    let scale = parseInt(document.getElementById("scale").value);

    if (isNaN(scale)) {
        alert("Error! The scale was set to a non-integer or non-numeric value.");
        return;
    }

    console.log("Scale: " + scale);

    // Get image dimentions
    let screenDelimiter = source.indexOf("x");
    let index = source.search(/[wasdgbnp\(\)]/);
    var width = parseInt(source.substr(0, screenDelimiter), 10);
    var height = parseInt(source.substr(screenDelimiter + 1, index - 1), 10);

    if (isNaN(width) || isNaN(height)) {
        alert("Error! There was a problem parsing the image dimentions.\nMake sure that your code begins with the format:\n\"wwwxhhh\"\nwhere \"www\" is the width and \"hhh\" is the height in pixels.");
        return;
    }

    // Setup our canvas
    canvas.width = width * scale;
    canvas.height = height * scale;

    console.log("Width: " + width + ", Height: " + height);
    console.log("Scaled Width: " + canvas.width + ", Height: " + canvas.height);

    var colorIndicies = new Array(width * height);

    // Initialize the image
    for (var x = 0; x < width; x++) {
        for(var y = 0; y < height; y++) {

             // Initial indicies array
            colorIndicies[y * width + x] = 0;

            setPixel(context, colorIndicies, x, y, width, scale);
        }
    }

    var xIndex = 0;
    var yIndex = 0;

    var xIndexView = document.getElementById("xindex");
    var yIndexView = document.getElementById("yindex");
    var indexView = document.getElementById("parse-index");

    // Main loop
    function main(tframe) {

        var command = source.charAt(index);

        switch(command.toLowerCase()) {
            case 'w':
                yIndex -= 1;
                if (yIndex < 0)
                    yIndex = height - 1;
                break;

            case 's':
                yIndex += 1;
                if (yIndex >= height)
                    yIndex = 0;
                break;
              
            case 'a':
                xIndex -= 1;
                if (xIndex < 0)
                    xIndex = width - 1;
                break;
               
            case 'd':
                xIndex += 1;
                if (xIndex >= width)
                    xIndex = 0;
                break;

            case '(':
                while (source.charAt(index) !== ')') {
                    index += 1;
                }
                break;

            case 'g':
                var delta = parseInt(source.substring(index + 1).match(/^[-0-9]+/m), 10);
                if (isNaN(delta)) {
                    alert("Error! \"g\" command encountered with non-numeric delta at index: '" + index + "'");
                    index = -1; // exit
                } else {
                    index -= delta;
                }
                break;

            case 'b':
                var deltaRaw = String(source.substring(index + 1).match(/^[-0-9]+/m));
                var delta = parseInt(deltaRaw, 10);
                if (isNaN(delta)) {
                    alert("Error! \"b\" command encountered with non-numeric delta at index: '" + index + "'");
                    index = -1; // exit
                } else if (colorIndicies[yIndex * width + xIndex] === 0) {  // Only branch on 0
                    index -= delta;
                } else {
                    index += deltaRaw.length;
                }
                break;
            
            case 'p':
                colorIndicies[yIndex * width + xIndex] += 1;
                colorIndicies[yIndex * width + xIndex] = colorIndicies[yIndex * width + xIndex] % colors.length;
                
                setPixel(context, colorIndicies, xIndex, yIndex, width, scale);
                break;

            case 'n':
                colorIndicies[yIndex * width + xIndex] -= 1;
                if (colorIndicies[yIndex * width + xIndex] < 0) {
                    colorIndicies[yIndex * width + xIndex] = colors.length - 1;
                }

                setPixel(context, colorIndicies, xIndex, yIndex, width, scale);
                break;
            
            case '\t':  // Skip whitespace
            case '\n':
            case '\r':
            case '\v':
            case '\0':
            case ' ':
                break;

            default: 
                if (index < source.length) {
                    console.log("Invalid command: '" + command + "'");
                    alert("Invalid command encountered at index '" + index + "'.\nCommand: " + command);
                }
                index = -1; // stop;
                break;

        }

        if (index >= 0 && !stopImageRender) {
            // Request the animation frame
            window.requestAnimationFrame(main);

            index += 1;
            xIndexView.innerHTML = "x-index: " + xIndex;
            yIndexView.innerHTML = "y-index: " + yIndex;
            indexView.innerHTML = "Parse-index: " + index;
        } else {
            stopImageRender = false;
            console.log("Stopped");
        }
    }

    // Start
    main(0);
}

function setPixel(context, colorData, xIndex, yIndex, imageWidth, scale) {

    var color = colorData[yIndex * imageWidth + xIndex];

    // console.log("x: " + xIndex + ", y: " + yIndex + ", c:" + color);

    context.fillStyle = "rgba(" + String(colors[color][0]) + "," + String(colors[color][1]) + "," + String(colors[color][2]) + ")";
    var scaledX = xIndex * scale;
    var scaledY = yIndex * scale;
    context.fillRect(scaledX, scaledY, scale, scale);
}

