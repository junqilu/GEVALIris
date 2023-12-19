# AstrocyteMelanomaCoCulture
This directory stores the code for processing the images of astrocyte-melanoma co-culture. 
* Because ImageJ macro language is very similar to JavaScript, all the codes are in .js format during development in WebStorm

## Requirements for the input images
* All input files should be .ims
* After being imported, it should be a stack of 3 slices: The stack needs to follow this order for the images 
  1. Image taken at 405 nm excitation 
  2. Image taken at 488 nm excitation 
  3. Bright-field
     * New code can take cares of stacks without brightfields so this is optional

## Use
1. Donwload the .js file locally and rename the extension to .ijm
2. From ImageJ -> Plugins -> Macros -> Install to install this .ijm
3. Enjoy

## Code
The code was developed based on this paper: https://pubmed.ncbi.nlm.nih.gov/35094327/

Below are the sections about what the code is doing

### Image processing for 1 image
All the steps below have been incorporated into 1 big macro where it only requires human users to do 2 things: 
* Select out background areas and add them into ROI manager
* Adjust the bar for the threshold so the outline of cells can be determined

#### Better display and slice renaming
The raw .ims file is very black so this part of the code adjust the contrast automatically so the image is visible for the human eyes
* This doesn't change the raw data
* This excludes the bright-field image

Additionally, this part of the code also rename slices using 405, 488, and brightfield, so they're easier to refer later

#### Background subtraction 
This section asks the user to make some selections on the background (can be done by the rectangle selection tool) in whatever number they like (3 selections are enough). Then an average intensity will be calculated from these selections and the average value will be used for subtraction from all the pixels
* This excludes the bright-file image

#### Background set to NaN 
This section asks the user to set a threshold for the outline of the cells so the background can be set to NaN to avoid an error caused by division by zero in a later step
* This is only done on the 488 nm excitation image since it will be used as the denominator

#### Generate ratio heatmap
This step generate and save the ratio heatmap from 405/488 images, save the heatmap and also an overlay of the heatmap on the bright-field

#### Generate montage
This step generate and save a montage of 405, 488, bright-field, and ratio heatmap in a 2 by 2 grid

#### Finish up
This step saves the stack used to make the montage in case you want to make changes to it later

Then this step closes all the windows generated from the initial input stack so the user is ready to process the next image

### Normalize all ratio heatmaps
After all the single images have been processed, you need to normalize all the ratio heatmaps together

This only requires the human user to select out the folder that stores all the ratio heatmaps and it'll do all the normalization and saving automatically

## Output structure
The code will create a folder called __Fiji_output__ on the desktop, if that folder doesn't already exist. The folder contains the following directories depending on whether your input stack contains the brightfield:

| Input stack types           | 3 slices (with brightfields)                                                                   | 2 slices (without brightfields)                                                      |
|-----------------------------|------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| Heatmap_images              | Both .jpg & .tif                                                                               | Both .jpg & .tif                                                                     |
| Heatmap_overlay_brightfield | Both .jpg & .tif                                                                               | N/A                                                                                  |
| Histogram_data              | 1 .csv                                                                                         | 1 .csv                                                                               |
| Histogram_images            | 1 .tif                                                                                         | 1 .tif                                                                               |
| Montage_images              | Both .jpg & .tif of 2 × 2 montage of 405 nm channel, 488 channel, brightfield, & ratio heatmap | Both .jpg & .tif of 1 × 3 monatge of 405 nm channel, 488 nm channel, & ratio heatmap |
| Processed_stacks            | 1 .tif                                                                                         | 1 .tif                                                                               |
| ROI                         | 1 .zip                                                                                         | 1 .zip                                                                               |