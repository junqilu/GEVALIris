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

function locate_image_by_regex(regex_str){//This function only outputs 1 unique image that matches regex_str
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

function locate_images_by_regex(regex_str){//This function return s an array of images that match the regex_str
    found_images_array = newArray();

    images = getList("image.titles");
    for (i = 0; i < images.length; i++) { //Iterate through all opened images
        if (matches(images[i], regex_str)) {
            found_images_array = append_to_array(found_images_array, images[i]);
        } else {
            //Do nothing
        }
    }

    if (found_images_array.length > 0) {
        return found_images_array; //This should be a string for the image's name
    }else {
        return "No match imaged found!";
    }
}

function judge_substr_in_str(substr, str){ //Judge whether the str contains a substr
    if (matches(str, ".*"+substr+".*")){
        return true;

    }else {
        return false;
    }
}

function save_image (save_directory,image_name_str, format_str){
    //To keep things simple, image_name_str will be the image window's title but also the filename when save the image locally

    //Translate format_str into the corresponding file extension
    if (format_str == "Tiff") {
        file_extension = ".tif"; //This is the raw image format, and it has no colors. But it can be import back to ImageJ for further adjustment
    }else if (format_str == "Jpeg") {
        file_extension = ".jpg"; //This is for the display and presentation etc since it has colors. You can further adjust this image but it'll be different from what it looks like if you do it within ImageJ all the way without the exporting and importing
    } else {
        //Do nothing
        //You can keep adding more translation on the file formats here
    }

    saveAs(format_str, save_directory+image_name_str+file_extension);
    rename_image(image_name_str+file_extension, image_name_str); //Rename the image back to get rid of the file extension part. This makes the referencing easier in later steps
}

function save_images(save_directory,image_name_str, format_array){
    for (i = 0; i < format_array.length; i++){
        save_image(save_directory,image_name_str,format_array[i]);
    }
}


function rename_image(original_name_str, new_name_str) {
    if (original_name_str != new_name_str && isOpen(original_name_str)){ //You only rename the image if it is currently opened. This can avoid some errors
        selectImage(original_name_str);
        rename(new_name_str);
        return new_name_str;
    }else{
        print("No window for "+original_name_str+" was found so cannot rename it!");
        print("Your original_name_str is "+original_name_str);
        print("Your new_name_str is "+new_name_str);
        print("If your original_name_str and new_name_str are only different in a string for extension, you can ignore this");
    }
}

function merge_two_images (image_name_str_1, image_name_str_2){
    run("Merge Channels...", "c1=["+image_name_str_1+"] c2="+image_name_str_2+" create keep");
    //"create" means to check for "Create composite"
    //"keep" means to check for "Keep source images"

    new_image_name = rename_image("Composite", "Composite of "+image_name_str_1+" and "+image_name_str_2);
    return new_image_name; //By returning rename_image, I can relocate the image I want really easily
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

macro "display_and_slice_renaming [d]" {
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

macro "heatmap_generation_and_save [h]" {
    stack_title = get_stack_name();

    stack_to_images(); //You have to split to use the image calculator

    image_1 = locate_image_by_regex(".*405$"); //Image's name ends with 405
    image_2 = locate_image_by_regex(".*488$"); //Image's name ends with 488
    image_division(image_1, image_2);

    result_image = locate_image_by_regex("^Result.*"); //Image's name starts with "Result"
    apply_LUT(result_image, "mpl-inferno"); //Apply the mpl-inferno style to the heatmap
    rename_image(result_image, "Heatmap of " + stack_title);

    save_directory = "C:\\Users\\louie\\Desktop\\Fiji_output\\";
    image_name_str = locate_image_by_regex("^Heatmap.*");
    format_array = newArray("Tiff", "Jpeg");
    save_images(save_directory, image_name_str, format_array);
}




//Functions for merging heatmap and bright-field
macro "overlay_heatmap_on_brightfield_and_save [o]"{
    heatmap_image = locate_image_by_regex("^Heatmap.*");
    brightfield_image = locate_image_by_regex(".*brightfield$");

    heatmap_merge_brightfield_image = merge_two_images(heatmap_image, brightfield_image);

    save_directory = "C:\\Users\\louie\\Desktop\\Fiji_output\\";
    image_name_str = locate_image_by_regex(heatmap_merge_brightfield_image);
    format_array = newArray("Tiff", "Jpeg");
    save_images(save_directory, image_name_str, format_array);
    close(heatmap_merge_brightfield_image);
}



//Functions for making and saving the montage
macro "montage_generation_and_save [m]" {
    //Try to reobtain the stack_name from the heatmap's image name
    heatmap_image = locate_image_by_regex("^Heatmap.*");
    heatmap_image_name_array = split(heatmap_image, "of ");
    stack_name = heatmap_image_name_array[1];

    run("Merge Channels...", "c1="+stack_name+"_405 c2="+stack_name+"_488 c3="+stack_name+"_brightfield c4=[Heatmap of "+stack_name+"] create keep");
    //Making merge channel image is the only way to have different LUT on different slices of a stack

    //Rename slices
    //1st slice is the 405 nm image
    setSlice(1);
    run("Set Label...", "label=["+stack_name+"_405]");

    //2nd slice is the 488 nm image
    setSlice(2);
    run("Set Label...", "label=["+stack_name+"_488]");

    //3rd slice is the brightfield image
    setSlice(3);
    run("Set Label...", "label=["+stack_name+"_brightfield]");

    //4th slice is the ratio heatmap
    setSlice(4);
    run("Set Label...", "label=["+stack_name+"_heatmap]");



    Stack.setDisplayMode("color"); //Change the display mode from composite to color so the 1st image of the montage result is correct. This doesn't change the image type
    run("Make Montage...", "columns=2 rows=2 scale=1 label");
    //"label" means label the montage using the slice names
    //The resulting montage will be a RGB image


    montage_filename = "Montage of "+stack_name;
    rename_image("Montage", montage_filename);

    save_directory = "C:\\Users\\louie\\Desktop\\Fiji_output\\";
    image_name_str = locate_image_by_regex("^Montage.*");
    format_array = newArray("Tiff", "Jpeg");
    save_images(save_directory, image_name_str,format_array);
    close(montage_filename);
}



//Functions for finishing things up
function save_processed_stack(){
    //Try to reobtain the stack_name from the heatmap's image name
    heatmap_image = locate_image_by_regex("^Heatmap.*");
    heatmap_image_name_array = split(heatmap_image, "of ");
    stack_name = heatmap_image_name_array[1];

    processed_stack_name = "Processed stack of "+stack_name;
    rename_image("Composite", processed_stack_name);

    save_directory = "C:\\Users\\louie\\Desktop\\Fiji_output\\";
    format_array = newArray("Tiff"); //The thumbnail will look crappy but if you import the .tif back in ImageJ, you can still edit it as you like
    save_images(save_directory, processed_stack_name, format_array);
    close(processed_stack_name);
}

macro "finish_up [f]"{
    save_processed_stack();

    heatmap_image = locate_image_by_regex("^Heatmap.*");
    heatmap_image_name_array = split(heatmap_image, "of ");
    stack_name = heatmap_image_name_array[1];

    //Close up all remaining windows from processing this stack
    close_windows_array = locate_images_by_regex("^"+stack_name+".*");
    close_windows_array = append_to_array(close_windows_array, heatmap_image);
    for(i = 0; i < close_windows_array.length; i++){
        close(close_windows_array[i]);
    }
}


//Functions to auto the whole process together
macro "auto_everything [z]" {
    run("display_and_slice_renaming [d]");

    waitForUser("Once you finish adding selection for background with shortcut key [a], click OK");

    run("clean_background [c]");

    run("set_background_to_NaN [x]");

    run("heatmap_generation_and_save [h]");

    run("overlay_heatmap_on_brightfield_and_save [o]");

    run("montage_generation_and_save [m]");

    run("finish_up [f]");
}


