import React, { useContext, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '@emotion/react';
import { Box, TextField, Button, Card, CardContent, Theme, Typography, Grid, CardMedia, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, makeStyles } from '@mui/material';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { createStore } from 'redux';


interface ICoordinates {
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    resolutionIMG: Array<Number>,
    randomColor: string
}


const ExperimentGetGUIComponentsCoordenates: React.FC = () => {
    var initialElements: { [name: string]: ICoordinates; } = {};
    const { t } = useTranslation();
    const theme = useContext(ThemeContext) as Theme;
    const [coordinates, setcoordinates] = useState({ x1: 0, y1: 0, x2: 0, y2: 0, resolutionIMG: [0, 0], randomColor: "" });
    const [elements, setElements] = useState(initialElements);
    const textRef = useRef<any>('');
    const url = process.env.PUBLIC_URL + "example_image.png";//cambiar a la url real
    const [resolutionBRW, setResolutionBRW] = useState([0, 0]);
    const numberCaptures = 1; //cambiar al número de capturas a tratar
    const actualCapture = 1; //numero actual de capturas
    const [draggable, setDraggable] = useState(false);
    const [resolutionIMG, setResolutionIMG] = useState([0, 0]);


    window.onresize = function () {
        var imgRect: any = document.getElementById('imgRect');
        var width: number = imgRect.clientWidth;
        var height: number = imgRect.clientHeight;
        let newRes = resolutionBRW;
        newRes[0] = width;
        newRes[1] = height;
        setResolutionBRW([...newRes]);
        updateRectangleTMP();
    }

    const addElementToTable = () => {
        setElements({
            ...elements,
            [textRef.current.value.trim()]: coordinates
        })
    }

    const getResolution = (e: any) => {
        getResolutionBRW(e);
        var img = new Image();
        img.src = url;
        img.onload = function () {
            setcoordinates({
                ...coordinates,
                resolutionIMG: [img.width, img.height]
            })
        }
        setResolutionIMG([img.width, img.height]);
    }

    const getResolutionBRW = (e: any) => {
        var width: number = e.currentTarget.clientWidth;
        var height: number = e.currentTarget.clientHeight;
        setResolutionBRW([width, height]);
    }

    const setCoordenatesByResolution = (list: any) => {
        var randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
        var resIMG = coordinates.resolutionIMG;
        if (resIMG !== resolutionBRW) {
            list.x1 = Math.round(resIMG[0] * list.x1 / resolutionBRW[0])
            list.y1 = Math.round(resIMG[1] * list.y1 / resolutionBRW[1])
            list.x2 = Math.round(resIMG[0] * list.x2 / resolutionBRW[0])
            list.y2 = Math.round(resIMG[1] * list.y2 / resolutionBRW[1])
        }
        setcoordinates({
            ...coordinates,
            x1: list.x1,
            y1: list.y1,
            x2: list.x2,
            y2: list.y2,
            randomColor: randomColor
        })
    }

    const handleMouseEnter = (e: any) => {
        //startDrag(e);
        var x: number = (e.nativeEvent.offsetX >= 0 ? e.nativeEvent.offsetX : 1)
        var y: number = (e.nativeEvent.offsetY >= 0 ? e.nativeEvent.offsetY : 1)
        setcoordinates({
            ...coordinates,
            x1: x,
            y1: y
        })
    }

    const handleMouseLeave = (e: any) => {
        //stopDrag(e);
        var tx: number = (e.nativeEvent.offsetX > 0 ? e.nativeEvent.offsetX : 1)
        var ty: number = (e.nativeEvent.offsetY > 0 ? e.nativeEvent.offsetY : 1)
        var x1, y1, x2, y2: number
        if (coordinates.x1 <= tx) {
            x1 = coordinates.x1
        } else {
            x1 = tx
        }
        if (coordinates.y1 <= ty) {
            y1 = coordinates.y1
        } else {
            y1 = ty
        }
        if (coordinates.x1 > tx) {
            x2 = coordinates.x1
        } else {
            x2 = tx
        }
        if (coordinates.y1 > ty) {
            y2 = coordinates.y1
        } else {
            y2 = ty
        }
        setCoordenatesByResolution({
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2
        })
    }

    const removeElement = (key: string) => {
        let elementsCopy = elements;
        delete elementsCopy[key];
        setElements(
            { ...elementsCopy }
        )
    }

    function resizeRect(x: any, brw: any, img: any) {
        return Math.round(brw * x / img);
    }

    function startDrag(event: any) {
        var x: number = (event.nativeEvent.offsetX >= 0 ? event.nativeEvent.offsetX : 1)
        var y: number = (event.nativeEvent.offsetY >= 0 ? event.nativeEvent.offsetY : 1)
        setDraggable(true);
        var overlay = document.getElementById('overlay');

        if (overlay != null) {
            overlay.style.left = x + 'px';
            overlay.style.top = y + 'px';
            overlay.style.width = '0px';
            overlay.style.height = '0px';
        }
    }

    function stopDrag(event: any) {
        drawRightBottomCorner(event);
        setDraggable(false);
    }

    function drawRightBottomCorner(event:any) {
        var x2: number = (event.nativeEvent.offsetX >= 0 ? event.nativeEvent.offsetX : 1)
        var y2: number = (event.nativeEvent.offsetY >= 0 ? event.nativeEvent.offsetY : 1)

        if (!draggable) return;
        var overlay = document.getElementById('overlay');
        if (overlay != null) {
            var x1 = overlay.style.left
            var y1 = overlay.style.top
            overlay.style.width = 'calc(' + x2 + 'px - ' + x1 + ')';
            overlay.style.height = 'calc(' +y2 + 'px - ' + y1 + ')';
        }
      }

      function updateRectangleTMP() {
        var overlay = document.getElementById('overlay');
        if (overlay != null) {
            overlay.style.left = resizeRect(coordinates.x1, resolutionBRW[0], resolutionIMG[0])+"px";
            overlay.style.top = resizeRect(coordinates.y1, resolutionBRW[1], resolutionIMG[1])+"px";           
            overlay.style.width = (resizeRect(coordinates.x2, resolutionBRW[0], resolutionIMG[0]) - resizeRect(coordinates.x1, resolutionBRW[0], resolutionIMG[0]))+"px";
            overlay.style.height = (resizeRect(coordinates.y2, resolutionBRW[1], resolutionIMG[1]) - resizeRect(coordinates.y1, resolutionBRW[1], resolutionIMG[1]))+"px";
        }
      }


    return (
        <>
            <Typography variant="h4">
                {t('features.experiment.assist.title.elementselector')}
            </Typography>
            <Button
                variant="outlined"
                disabled={numberCaptures !== actualCapture}
                component={RouterLink}
                to="/screenshot-variability"
                style={{ fontSize: "small", marginLeft: 4 }}
                endIcon={<SettingsSuggestIcon />}>
                {t('features.experiment.assist.next')}</Button>
            <Grid
                container
                direction="row"
                justifyContent="space-around"
                alignItems="flex-start"
                spacing={4}>
                {Object.keys(elements).length > 0 &&
                    <Grid xs={12} sm={12} item order={{ lg: 1, xs: 1 }} style={{ marginTop: theme.spacing(2) }}>
                        <Card>
                            <TableContainer component={Paper} >
                                <Table aria-label="simple table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center">{t('features.experiment.assist.element.name')}</TableCell>
                                            <TableCell align="center">{t('features.experiment.assist.element.color')}</TableCell>
                                            <TableCell align="center">{t('features.experiment.assist.element.topleft')}&nbsp;(x,y)</TableCell>
                                            <TableCell align="center">{t('features.experiment.assist.element.botright')}&nbsp;(x,y)</TableCell>
                                            <TableCell align="center">{t('features.experiment.assist.delete')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.keys(elements).map((key, index) => (
                                            <TableRow
                                                key={index}
                                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                            >
                                                <TableCell align="center" component="th" scope="row">
                                                    {key}
                                                </TableCell>
                                                <TableCell align="center" sx={{
                                                    backgroundColor: elements[key].randomColor,
                                                    opacity: 0.3
                                                }}></TableCell>
                                                <TableCell align="center" >{elements[key].x1}, {elements[key].y1}</TableCell>
                                                <TableCell align="center" >{elements[key].x2}, {elements[key].y2}</TableCell>
                                                <TableCell align="center" >
                                                    <Button variant="contained" color="secondary" onClick={() => removeElement(key)}>
                                                        {t('features.experiment.assist.delete')}
                                                    </Button></TableCell>
                                            </TableRow>
                                        ))
                                        }
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    </Grid>
                }
                <Grid xs={12} lg={3} item style={{ marginTop: theme.spacing(2) }} order={{ lg: 2, xs: 3 }}>
                    <Card>
                        <CardContent>
                            <TextField inputRef={textRef} placeholder={t('features.experiment.assist.element.name')} label={t('features.experiment.assist.element.name')} />
                            <Typography component="div" >
                                {t('features.experiment.assist.coordinates.topleft')}:{coordinates.x1}, {coordinates.y1}
                            </Typography>
                            <Typography component="div">
                                {t('features.experiment.assist.coordinates.rightbot')}:{coordinates.x2}, {coordinates.y2}
                            </Typography>
                            <Grid container justifyContent="center" >
                                <Button variant="contained" color="secondary" style={{ margin: theme.spacing(2) }} onClick={addElementToTable}>
                                    {t('features.experiment.assist.add')}
                                </Button>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid xs={12} lg={9} item style={{ marginTop: theme.spacing(2) }} order={{ lg: 3, xs: 2 }}>
                    <Card>
                        <Box component={"div"}
                            sx={
                                {
                                    position: "relative"
                                }}>
                            <Box component={"div"}
                                id="overlay"
                                sx={
                                    {
                                        position: "absolute",
                                        outline: "2px solid black",
                                        backgroundColor: "blue",
                                        opacity: 0.3
                                    }}
                            ></Box>
                            {Object.keys(elements).length > 0 && Object.keys(elements).map((key, index) => (
                                <Box component={"div"}
                                    sx={
                                        {
                                            position: "absolute",
                                            left: resizeRect(elements[key].x1, resolutionBRW[0], resolutionIMG[0]),
                                            top: resizeRect(elements[key].y1, resolutionBRW[1], resolutionIMG[1]),
                                            width: resizeRect(elements[key].x2, resolutionBRW[0], resolutionIMG[0]) - resizeRect(elements[key].x1, resolutionBRW[0], resolutionIMG[0]),
                                            height: resizeRect(elements[key].y2, resolutionBRW[1], resolutionIMG[1]) - resizeRect(elements[key].y1, resolutionBRW[1], resolutionIMG[1]),
                                            outline: "2px solid black",
                                            backgroundColor: elements[key].randomColor,
                                            opacity: 0.3
                                        }}
                                ></Box>))
                            }
                            < CardMedia
                                component="img"
                                id="imgRect"
                                image={url}
                                alt="mock"
                                style={{
                                    height: "auto",
                                    maxWidth: "100%"
                                }}
                                /*onMouseMove={drawRightBottomCorner}*/
                                onLoad={getResolution}
                                onMouseDown={handleMouseEnter}
                                onMouseUp={handleMouseLeave}
                                /*onMouseLeave={stopDrag}*/
                                draggable={false}
                            />
                        </Box>
                    </Card>
                </Grid>
            </Grid >
        </>
    )
}
export default ExperimentGetGUIComponentsCoordenates;