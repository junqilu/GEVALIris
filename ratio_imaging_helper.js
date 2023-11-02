//Change the filename extension from .js to .ijm and then it can be installed into ImageJ

//For your ratio imaging of astrocyte-melanoma co-culture, in a stack of images, after the spliting, the image with a window name ending with "0001" is the Ex405, "0002" is the Ex488, and "0003" is the whitefield
//All functions work in the background and the macros are callable from the outside (by either click on the function or the shortcut key--the key in the [])
//After each edit, you have to reinstall the macro file into the ImageJ to test them out

//Indexes that start from 0: ROI in the ROI manager, arrays
//Indexes that start from 1: slices in a stack






//Basic functions
//This section contains basic functions that will be used in other functions
function get_stack_name(){ //Obtain the stack name from the current window
    //This may not be reliable when you have multiple windows since it seems like to just get the title from the current activated window
    stack_title = getTitle();
    stack_name_array = split(stack_title, "."); //file_name is an array
    stack_name = stack_name_array[0];

    return stack_name;
}

function print_array(input_array) { //Iterate through input_array to print out each value. This is for debugging
    for (i = 0; i < input_array.length; i++) {
        print(input_array[i]);
    }
}

function append_to_array(input_array, append_value) { //ImageJ script seems to lack a very basic append to an array function
    input_array = Array.concat(input_array, append_value);
    return input_array;
}

function average_array_num(input_array_num) { //input_array_num is an array of numbers and this function return the average from those numbers
    if (input_array_num.length == 0) {
        return 0; // Return 0 for an empty array to avoid division by zero.
    } else {
        sum = 0;
        for (i = 0; i < input_array_num.length; i++) {
            sum += input_array_num[i];
        }
        return sum / input_array_num.length;
    }
}

function convert_to_32_bit() { //You have to do this to have float results (32-bit) on the heatmap after the image division
    run("32-bit"); //Convert image type from 16-bit to 32-bit. This applies to all the slices in the stack
}

function locate_image_by_regex(regex_str){//You should only find 1 unique image from this function
    found_match = false;

    images = getList("image.titles");
    for (i = 0; i < images.length; i++) { //Iterate through all opened images
        if (matches(images[i], regex_str)) {
            output_image = images[i];
            found_match = true;
        } else {
            //Do nothing
        }
    }

    if (found_match) {
        return output_image; //This should be a string for the image's name
    }else {
        return "No match imaged found!";
    }
}





//Functions for better display and slice renaming
//These functions are automatic
function rename_slices(){
    filename = get_stack_name();

    //1st slice is the 405 nm image
    setSlice(1);
    run("Set Label...", "label=["+filename+"_405]");

    //2nd slice is the 488 nm image
    setSlice(2);
    run("Set Label...", "label=["+filename+"_488]");

    //3rd slice is the brightfield image
    setSlice(3);
    run("Set Label...", "label=["+filename+"_brightfield]");
}

function display_with_auto_contrast() { //Make the stack better displayed (increase contrast for 405 and 488 images) without changing the raw data
    for (i = 1; i < nSlices + 1; i++) { //Iterate all slices
        //nSlices is the predefined variable that stores the total number of slices in a stack
        if (i <= 2) { //Skip the last slice, which is the bright-field
            setSlice(i);
            run("Enhance Contrast", "saturated=0.35"); //One time is enough for you to see
            run("Apply LUT", "slice"); //Only apply the contrast adjustment to that slice rather than the whole stack
        }
    }
}

macro "better_display_and_slice_renaming [d]" {
    rename_slices();
    display_with_auto_contrast();
    setSlice(2); //Go back to the 2nd slice for the Ex488 image, which should be the brightest so it's easier to select for the background
}





//Functions for background subtraction
//This step requires users to select out some areas of the background and the rest of it is automatic
macro "add_selection_to_ROI_manager [a]" { //Add current selection into ROI manager
    //If you don't have a selection before this function, you'll have an error
    run("Add Selection..."); //Add the selection to overlay but doesn't open the ROI manager and doesn't show you the update on the ROI manager
}

function measure_background() { //Iterate through all ROI (background areas selected by the user)
    run("To ROI Manager");
    ROI_count = roiManager("count"); //Obtain the total number of ROI in the manager

    ROI_array = newArray(ROI_count);
    for (i = 0; i < ROI_count; i++) { //Iterate through all ROI
        //All the ROIs' names are in the format of "count-4digit" so the original order of ROIs is correct
        roiManager("Select", i); //Select each ROI by order

        roiManager("Rename", "Background_" + i + 1); //Rename because the original name has a random 4-digit number as part of it. i+1 because the index should start from 1 from a biological perspective
        ROI_array[i] = i;
    }

    //print_array(ROI_array);

    roiManager("Select", ROI_array);
    roiManager("multi-measure measure_all"); //Measure all the ROI in all slices

    //Measurements will go to the measurement table
}

function average_background() {

    // Initialize an array to store the "Mean" values where "Slice" = 1
    mean_slice_1 = newArray();
    mean_slice_2 = newArray();

    for (row = 0; row < nResults; row++) { // Loop through the rows in the Results Table
        if (getResult("Slice", row) == 1) {
            mean_slice_1 = append_to_array(mean_slice_1, getResult("Mean", row));
        } else if (getResult("Slice", row) == 2) {
            mean_slice_2 = append_to_array(mean_slice_2, getResult("Mean", row));
        } else {
            //Do nothing when slice is 3
        }

    }

    avg_background_slice_1 = average_array_num(mean_slice_1);
    avg_background_slice_2 = average_array_num(mean_slice_2);

    print("Slice 1's average background is " + avg_background_slice_1);
    print("Slice 2's average background is " + avg_background_slice_2);

    return newArray(avg_background_slice_1, avg_background_slice_2); //ImageJ script language doesn't have something similar to dict
}

function subtract_background(input_avg_background_array) {
    for (i = 1; i < nSlices + 1; i++) { //Iterate all slices
        if (i <= 2) { //Skip the last slice, which is the bright-field
            setSlice(i);
            run("Subtract...", "value=" + input_avg_background_array[i - 1] + " slice"); //The slice option limits the changes to that specific slice
            //The index for the array uses [i - 1] here because the array indexes start from 0 but the indexes for slices in a stack start from 1
        }
    }
}

function force_close_roi_manager() {
    //Close ROI manager without that annoying window pop out
    roiManager("reset"); //Clean up ROI manager such that when you close the manager in the next line, there's no pop out window
    close("ROI Manager");
}

macro "clean_background [c]" {
    measure_background();

    avg_background = average_background();

    run("Select None"); //This deselect anything on the images. Without this line, the next line of subtracting the background will only occur within the last ROI

    subtract_background(avg_background);

    force_close_roi_manager();

    //The Results table and the Log are for debugging. Normally I don't need to see them since after the background subtraction, I can tell it's successful by seeing lots of 0-value pixels in the background
    close("Results");
    close("Log");
}





//Functions for set background to NaN
function median_filter(radius_num) { //Smooth out the fuzziness
    for (i = 1; i < nSlices + 1; i++) {
        if (i <= 2) { //Skip the last slice, which is the bright-field
            setSlice(i);
            run("Median...", "radius=" + radius_num + " slice"); //The slice option limits the changes to that specific slice
        }
    }
}

function set_background_to_NaN_core() {
    /* setAutoThreshold("Otsu dark no-reset");
    run("NaN Background", "slice"); */
    //The lines above run things very fast without giving you a chance to adjust things manually so I commented them out

    run("Threshold..."); //This gives you a way to adjust the thresholding

    //Adjust the threshold
    waitForUser("Adjust the threshold and hit OK"); //Hitting OK will make the run the next line, which is to make the non-selected part as NaN automatically
    //The threshold window will also have an Apply button. Don't hit on that

    run("NaN Background", "slice");
    close("Threshold");
}


macro "set_background_to_NaN [x]" {
    convert_to_32_bit(); //Be ready for the later image division. This allows the 32-bit data type, aka float
    median_filter(2); //Dave likes to use radius = 2 for the median filter
    set_background_to_NaN_core();
}







//Functions for image division and generating heatmap
function stack_to_images() {
    //Image calculator requires you to split a stack into slices
    run("Stack to Images"); // Split a stack into images
}

function image_division(input_image_str_1, input_image_str_2) {
    imageCalculator("Divide create 32-bit", input_image_str_1, input_image_str_2);
    //"Divide" means division
    //"create" means to check the box for "Create new window"
    //"32-bit" means to check the box for "32-bit (float) result". This is why you need to change the image type to 32-bit previously

    close("Image Calculator");
}


function apply_LUT(input_image_str, LUT_name_str) {
    selectImage(input_image_str);
    run(LUT_name_str);

    run("Enhance Contrast", "saturated=0.35"); //Do some auto-contrast
}

function rename_image(original_name_str, new_name_str) {
    selectImage(original_name_str);
    rename(new_name_str);
}

macro "generate_ratio_heatmap [h]" {
    stack_title = get_stack_name();

    stack_to_images(); //You have to split to use the image calculator

    image_1 = locate_image_by_regex(".*405$"); //Image's name ends with 405
    image_2 = locate_image_by_regex(".*488$"); //Image's name ends with 488

    image_division(image_1, image_2);

    result_img = locate_image_by_regex("^Result.*"); //Image's name starts with "Result"

    apply_LUT(result_img, "mpl-inferno"); //Apply the mpl-inferno style to the heatmap

    rename_image(result_img, "Result of " + stack_title);
}



