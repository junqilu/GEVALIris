//Change the filename extension from .js to .ijm and then it can be installed into ImageJ

//For your ratio imaging of astrocyte-melanoma co-culture, in a stack of images, after the spliting, the image with a window name ending with "0001" is the Ex405, "0002" is the Ex488, and "0003" is the whitefield
//All functions work in the background and the macros are callable from the outside (by either click on the function or the shortcut key--the key in the [])
//After each edit, you have to reinstall the macro file into the ImageJ to test them out

//Indexes for slices in a stack start from 1

function rename_slices(){
    stack_title = getTitle();
    filename_array = split(stack_title, "."); //file_name is an array
    filename = filename_array[0];

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
    for (i = 1; i < nSlices + 1; i++) { //Iterate through all slices
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