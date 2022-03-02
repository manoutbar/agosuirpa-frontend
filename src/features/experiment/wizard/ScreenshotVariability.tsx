import React, { useContext, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '@emotion/react';
import { Button, Select, MenuItem, Box, TextField, Card, CardContent, Theme, Typography, Grid, CardMedia } from '@mui/material';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import Tooltip from '@mui/material/Tooltip';
import { ICoordinates, IElements } from './types';
import { useSelector, useDispatch } from 'react-redux';
import {  wizardSelector, wizardSlice } from './slice';
import { Link as RouterLink } from 'react-router-dom';

const funcitonList = [
  {
    "id": 1,
    "function_name": "copy_image",
    "description": "copy an image without changes",
    "params": [1, 2]
  },
  {
    "id": 2,
    "function_name": "change_ui",
    "description": "change element in ui",
    "params": []
  }
]

const paramList = [
  {
    "id": 1,
    "label": "Insert text",
    "placeholder": "Text",
    "data_type": "String",
    "validation_needs": "Required",
    "description": "Insert a text in the screenshot "
  },
  {
    "id": 2,
    "label": "Random UI",
    "placeholder": "0",
    "data_type": "Integer",
    "validation_needs": "Required",
    "description": "Change the number passed of GUI elements randomly"
  }
]

//TODO: poner el contenido como feature.experiment.wizard... etc

const ScreenshotVariability: React.FC = () => {
  const { elements } = useSelector(wizardSelector);
  var initialElements: IElements = { ...elements }
  var initialStateCoordinates: ICoordinates = { x1: 0, y1: 0, x2: 0, y2: 0, resolutionIMG: [0, 0], randomColor: "", processed: false, function_variability: 0, params: {} };
  const { t } = useTranslation();
  const theme = useContext(ThemeContext) as Theme;
  const url = process.env.PUBLIC_URL + "example_image.png";//TODO:cambiar a la url real
  const [resolutionBRW, setResolution] = useState([0, 0]);
  const [coordinates, setcoordinates] = useState(initialStateCoordinates);
  const [functionID, setFunction] = useState(0);
  var [elementsTMP, setElements] = useState(initialElements);
  const [count, setCount] = useState(Object.keys(elementsTMP).length)
  const [elementName, setName] = useState("");
  const dispatch = useDispatch();

  //TODO: create repository call
  const variabilityFunctions = funcitonList;
  //TODO: create repository call
  // const params = paramList;

  function onLoadImage() {
    getResolutionBRW();
    onEvent();
  }

  function onEvent() {
    let countTMP = count
    for (const [key] of Object.entries(elementsTMP)) {
      if (count === 0 || Object.keys(elementsTMP).length === 0) {
        dispatch(wizardSlice.actions.setElements(elementsTMP))
      } else {
        if (elementsTMP[key].processed === false) {
          let coor = elementsTMP[key]
          setcoordinates({ ...coor });
          setName(key)
          countTMP = countTMP - 1
          setCount(countTMP);
          break;
        }
      }
    }
  }
  window.onresize = function () {
    getResolutionBRW()
  }

  function getResolutionBRW() {
    var imgRect: any = document.getElementById('imgRect');
    var width: number = imgRect.clientWidth;
    var height: number = imgRect.clientHeight;
    let newRes = resolutionBRW;
    newRes[0] = width;
    newRes[1] = height;
    setResolution([...newRes]);
  }
  //TODO: cambiar a editar el elements del dispatcher borrando el elemento
  const removeElement = () => {
    let key = elementName;
    let elementsCopy = elementsTMP;
    delete elementsCopy[key];
    setElements(
      { ...elementsCopy }
    )
    onEvent();
  }

  function resizeRect(x: any, brw: any, img: any) {
    return Math.round(brw * x / img);
  }

  function handleChange(e: any) {
    let functionTMP = e.currentTarget.value;
    setFunction(functionTMP);
  }

  function saveElements() {
    let coordinateTMP = coordinates
    let elementsTMP2 = elementsTMP;
    coordinateTMP.function_variability = functionID
    coordinateTMP.params = ["text", 1] //TODO: cambiar al params real
    coordinateTMP.processed = true
    elementsTMP2[elementName] = coordinateTMP
    setElements({
      ...elementsTMP2
    })
    onEvent();
  }

  return (
    <>
      <Typography variant="h4">
        {t('features.experiment.assist.title.elementselector')}
      </Typography>
      <Button
        onClick={saveElements}
        variant="outlined"
        style={{ fontSize: "small", marginLeft: 4 }}
        endIcon={<SettingsSuggestIcon />}>
        {t('features.experiment.assist.next')}</Button>
      <Grid
        container
        direction="row"
        justifyContent="space-around"
        alignItems="flex-start"
        spacing={4}>
        <Grid xs={12} lg={12} item style={{ marginTop: theme.spacing(2) }} >
          <Card>
            <Box component={"div"}
              sx={
                {
                  position: "relative"
                }}>
              <Box component={"div"}
                sx={
                  {
                    position: "absolute",
                    left: resizeRect(coordinates.x1, resolutionBRW[0], coordinates.resolutionIMG[0]),
                    top: resizeRect(coordinates.y1, resolutionBRW[1], coordinates.resolutionIMG[1]),
                    width: resizeRect(coordinates.x2, resolutionBRW[0], coordinates.resolutionIMG[0]) - resizeRect(coordinates.x1, resolutionBRW[0], coordinates.resolutionIMG[0]),
                    height: resizeRect(coordinates.y2, resolutionBRW[1], coordinates.resolutionIMG[1]) - resizeRect(coordinates.y1, resolutionBRW[1], coordinates.resolutionIMG[1]),
                    outline: "2px solid black",
                    backgroundColor: coordinates.randomColor,
                    opacity: 0.3
                  }}
              ></Box>
              < CardMedia
                component="img"
                id="imgRect"
                image={url}
                alt="mock"
                style={{
                  height: "auto",
                  maxWidth: "100%"
                }}
                onLoad={onLoadImage}
                draggable={false}
              />
            </Box>
          </Card>
        </Grid>
        <Grid xs={12} lg={4} item style={{ marginTop: theme.spacing(2), marginBottom: theme.spacing(2) }} >
          <Card>
            <CardContent>
              <Typography component="div" >
                {t('features.experiment.assist.element.name')}: {elementName}
              </Typography>
              <Typography component="div">
                {t('features.experiment.assist.coordinates.coordinates')}:
              </Typography>
              <Typography component="div" >
                {t('features.experiment.assist.coordinates.topleft')}: ({coordinates.x1}, {coordinates.y1})
              </Typography>
              <Typography component="div">
                {t('features.experiment.assist.coordinates.rightbot')}:({coordinates.x2}, {coordinates.y2})
              </Typography>
              <Grid container justifyContent="center" >
                <Button variant="contained" color="secondary" style={{ margin: theme.spacing(2) }} onClick={removeElement}>
                  {t('features.experiment.assist.delete')}
                </Button>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} lg={4} item style={{ marginTop: theme.spacing(2), marginBottom: theme.spacing(2) }} >
          <Card>
            <CardContent>
              <Typography component="div" >
                {t('features.experiment.assist.function.variability_function')}:
              </Typography>
              <Select
                labelId="demo-simple-select-label"
                id="select_function"
                label={t('features.experiment.assist.variability_function')}
                onChange={handleChange}
              >
                {Object.keys(variabilityFunctions).map((key, index) => (
                  <Tooltip title={variabilityFunctions[index].description} placement="right-end">
                    <MenuItem value={variabilityFunctions[index].id}>{variabilityFunctions[index].function_name}</MenuItem>
                  </Tooltip>
                ))}
              </Select>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} lg={4} item style={{ marginTop: theme.spacing(2), marginBottom: theme.spacing(2) }} >
          <Card>
            <CardContent>
              <Typography component="div" >
                {t('features.experiment.assist.coordinates.topleft')}:
              </Typography>
              <Typography component="div">
                {t('features.experiment.assist.coordinates.rightbot')}:
              </Typography>

            </CardContent>
          </Card>
        </Grid>
      </Grid >
    </>
  )
}

export default ScreenshotVariability;