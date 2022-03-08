import React, { useContext, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '@emotion/react';
import { IconButton, Select, MenuItem, Box, TextField, Button, Card, CardContent, Theme, Typography, Grid, CardMedia, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { screenshotRepository, updateJsonConf, wizardSelector, wizardSlice, guiComponentCategoryRepository, guiComponentRepository, variabilityFunctionCategoryRepository, variabilityFunctionRepository, paramFunctionCategoryRepository } from './slice';
import { useHistory, useParams } from 'react-router-dom';
import { experimentsSelector } from '../slice';
import { authSelector } from 'features/auth/slice';
import Tooltip from '@mui/material/Tooltip';
import { IDependency, IScreenshotColumn, ICoordinates, IElements, IScreenshot, IArguments } from './types';
import { FunctionParamResponse, CategoryResponse, CategoryDTO, GUIComponentDTO, FunctionParamDTO, VariabilityFunctionDTO, VariabilityFunctionResponse, GUIComponentResponse } from 'infrastructure/http/dto/wizard'
import { WindowSharp } from '@mui/icons-material';
import Http from "infrastructure/http/http";
import { json } from 'stream/consumers';
import ChevronLeft from "@mui/icons-material/ChevronLeft";


//TODO: FunctionParam del tipo ListElements, será un select de múltiples files que se enviarán a BD
//TODO: meter los resultados de los funciones/params/gui en el wizard

export interface IRandomColor {
    [name: string]: string[]
}

const ExperimentGetGUIComponentsCoordenates: React.FC = () => {
    //Carga de variables externas
    const { seed } = useSelector(wizardSelector);
    const { detail } = useSelector(experimentsSelector);
    const { variant } = useParams<{ variant: string }>();
    const { act } = useParams<{ act: string }>();
    const { screenshot_filename } = useParams<{ screenshot_filename: string }>();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const history = useHistory();
    const { token } = useSelector(authSelector);
    const theme = useContext(ThemeContext) as Theme;

    //Inicialización de variables temporales
    const initialArgs: IArguments = { id: 0, coordinates: [], name: "", args: {} }
    const initialScreen: IScreenshot = {}
    const countID = 1;
    const initialDependency: IDependency = { Activity: "", V: 0, id: 0 }
    const initialparams: FunctionParamDTO[] = []
    const initialVarFunction: VariabilityFunctionDTO[] = []
    const initialguiComponents: GUIComponentDTO[] = []
    const initialColors: IRandomColor = {}
    const initialVariants: string[] = []

    //Argumentos de screenshots a almacenar
    const [json_conf, setjJon_conf] = useState({ ...seed });

    //Variables temporales
    const [resolutionBRW, setResolutionBRW] = useState([0, 0]);
    const [resolutionIMG, setResolutionIMG] = useState([0, 0]);
    const [functionID, setFunction] = useState(0);
    const [guiID, setGUI] = useState(0);
    const [count, setCount] = useState(countID);
    const [url, setUrl] = useState("");//process.env.PUBLIC_URL + "example_image.png"
    const [screenshots, setScreenshot] = useState(initialScreen);
    const [argumentsCoor, setArgumentsCoor] = useState(initialArgs);
    const [randomColor, setRandomColor] = useState(initialColors);
    const actRef = useRef<any>('');
    const varRef = useRef<any>(0);
    const [errorMessage, setErrorMessage] = useState(false);
    //Cargas de BD temporales
    const [variabilityFunctions, setVariabilityFunctions] = useState(initialVarFunction);
    const [paramsList, setParamsFunctions] = useState(initialparams);
    const [guiComponents, setGuiComponents] = useState(initialguiComponents);
    const [params, setParams] = useState(initialparams);
    const [variantDependency, setVariantDependency] = useState(initialVariants);
    const [activityDependency, setActivityDependency] = useState(initialVariants);
    const [varAct, setVarAct] = useState(["", ""]);

    const getScreenshot = async (token: string, path: string) => {
        let src = '';
        if (url === "") {

            try {
                const res = await screenshotRepository.get(
                    path, token
                );
                const imageBlob = await res.blob();
                src = URL.createObjectURL(imageBlob);
                setUrl(src);
            } catch (ex) {
                console.error('error screenshot show', ex);
            }
        }

        return src;
    }

    //Peticiones a BD
    const selectVarFuncByCat = async (token: string, name: string) => {
        let categories: CategoryResponse = await variabilityFunctionCategoryRepository.list(token);
        let categoryId = selectCategoryByName(categories.results, name);
        let varFunc = await variabilityFunctionRepository.list(token);
        let test;
        try {
            let ret: VariabilityFunctionDTO[] = [];
            test = varFunc.results.filter(function (itm: any) {
                if (itm.variability_function_category === categoryId[0].id) {
                    ret.push(itm);
                }
                setVariabilityFunctions([...ret]);
                return ret;
            })
        } catch (ex) {
            console.error('error listing functions by category result', ex);
        }
        return test;
    }
    //GUI components by category name
    const selectGUIByCat = async (token: string, name: string) => {
        let categories: CategoryResponse = await guiComponentCategoryRepository.list(token);
        let categoryId = selectCategoryByName(categories.results, name);
        let guiComp = await guiComponentRepository.list(token);
        let test;
        try {
            let ret: GUIComponentDTO[] = [];
            test = guiComp.results.filter(function (itm: any) {
                if (itm.gui_component_category === categoryId[0].id) {
                    ret.push(itm);
                }
                setGuiComponents([...ret]);
                return ret;
            })
        } catch (ex) {
            console.error('error listing functions by category result', ex);
        }
        return test;
    }
    //Params
    const paramsListResults = async (token: string) => {
        try {
            let paramTMP: FunctionParamResponse = await paramFunctionCategoryRepository.list(token);
            setParamsFunctions([...paramTMP.results]);
            return paramTMP.results;
        } catch (ex) {
            console.error('error getting params function result', ex);
        }
    }

    function paramsByFunction(functionTMP: number) {
        let paramsTMP: FunctionParamDTO[] = [];
        let paramsID = []
        for (let f of variabilityFunctions) {
            if (f.id === functionTMP && f.params.length > 0) {
                for (let id2 of paramsList) {
                    paramsID = f.params.filter(c => (id2.id === c) ? c : "");
                    if (paramsID.length > 0) {
                        paramsTMP.push(id2);
                    }
                }
            }
        }
        setParams([...paramsTMP]);
    }
    //Seed variants
    function seedVariants() {
        let variantListTMP: string[] = []
        Object.keys(json_conf).map((key) => (variantListTMP.push(key)))
        setVariantDependency([...variantListTMP])
    }

    function activitiesByVariant(variantKey: string) {
        let activityListTMP: string[] = []
        Object.keys(json_conf[variantKey]).map((key) => (activityListTMP.push(key)))
        setActivityDependency([...activityListTMP])
    }

    function getResolutionBRW() {
        var imgRect: any = document.getElementById('imgRect');
        var width: number = imgRect.clientWidth;
        var height: number = imgRect.clientHeight;
        let newRes = resolutionBRW;
        newRes[0] = width;
        newRes[1] = height;
        setResolutionBRW([...newRes]);
    }

    function getResolution() {
        var img = new Image();
        img.src = url;
        img.onload = function () {
            let newRes = resolutionIMG;
            newRes[0] = img.width;
            newRes[1] = img.height;
            setResolutionIMG([...newRes]);
        }
    }

    useEffect(() => {
        let aux: string[] = [];
        if (detail !== null && url === "") {
            aux = detail.screenshotsPath.split("/");
            getScreenshot(token ?? "", aux[aux.length - 1] + "/" + screenshot_filename);
        }
        seedVariants();
        getResolution();
    }, []);

    window.onresize = function () {
        getResolutionBRW();
    }

    function handleMouseEnter(e: any) {
        let x: number = (e.nativeEvent.offsetX >= 0 ? e.nativeEvent.offsetX : 1)
        let y: number = (e.nativeEvent.offsetY >= 0 ? e.nativeEvent.offsetY : 1)
        let argsTMP = argumentsCoor;
        argsTMP.coordinates = [x, y, 0, 0]
        setArgumentsCoor({
            ...argsTMP
        })
    }

    function handleMouseLeave(e: any) {
        var tx: number = (e.nativeEvent.offsetX > 0 ? e.nativeEvent.offsetX : 1)
        var ty: number = (e.nativeEvent.offsetY > 0 ? e.nativeEvent.offsetY : 1)
        var x1, y1, x2, y2: number
        if (argumentsCoor.coordinates[0] <= tx) {
            x1 = argumentsCoor.coordinates[0]
        } else {
            x1 = tx
        }
        if (argumentsCoor.coordinates[1] <= ty) {
            y1 = argumentsCoor.coordinates[1]
        } else {
            y1 = ty
        }
        if (argumentsCoor.coordinates[0] > tx) {
            x2 = argumentsCoor.coordinates[0]
        } else {
            x2 = tx
        }
        if (argumentsCoor.coordinates[1] > ty) {
            y2 = argumentsCoor.coordinates[1]
        } else {
            y2 = ty
        }
        if (resolutionIMG !== resolutionBRW) {
            x1 = Math.round(resolutionIMG[0] * x1 / resolutionBRW[0])
            y1 = Math.round(resolutionIMG[1] * y1 / resolutionBRW[1])
            x2 = Math.round(resolutionIMG[0] * x2 / resolutionBRW[0])
            y2 = Math.round(resolutionIMG[1] * y2 / resolutionBRW[1])
        }
        let argsTMP = argumentsCoor;
        argsTMP.coordinates = [x1, y1, x2, y2]
        setArgumentsCoor({
            ...argsTMP
        })
    }

    const removeElement = (key: string, id: number) => {
        let screenTMP = screenshots;
        let colorTMP = randomColor;
        screenTMP[key].splice(id, 1);
        colorTMP[key].splice(id, 1);
        if (screenTMP[key].length === 0) {
            delete screenTMP[key];
            delete colorTMP[key];
        }
        setScreenshot(
            { ...screenTMP }
        )
        setRandomColor({ ...colorTMP })
    }

    function saveAndEnd() {
        if (Object.keys(screenshots).length > 0) {
            let screenTMP = screenshots;
            let screenColumn: IScreenshotColumn = {
                initValue: json_conf[variant][act].Screenshot.initValue,
                name: json_conf[variant][act].Screenshot.name,
                variate: 1,
                args: screenTMP
            };
            dispatch(wizardSlice.actions.setVariabilityConfiguration({
                ...json_conf,
                [variant]: {
                    ...json_conf[variant],
                    [act]: {
                        ...json_conf[variant][act],
                        ["Screenshot"]: screenColumn
                    }
                }
            }));
        }
        history.push('/column-variability/' + variant + '/' + act)
    }

    function onLoadImage() {
        selectVarFuncByCat(token ?? "", "Screenshot");
        selectGUIByCat(token ?? "", "Screenshot");
        paramsListResults(token ?? "");
        getResolution();
        getResolutionBRW();
    }

    function getByID(obj: any, idO: number) {
        return obj.find((o: { id: number; }) => (o.id === idO) ? o : null)
    }

    function selectCategoryByName(categories: any, name: string) {
        let test;
        try {
            test = categories.filter(function (itm: any) {
                let ret = "";
                if (itm.name === name) {
                    return ret = itm;
                }
                return ret;
            })
        } catch (ex) {
            console.error('error selecting category by name result', ex);
        }
        return test;
    }

    function resizeRect(x: any, brw: any, img: any) {
        return Math.round(brw * x / img);
    }

    function handleChangeFunction(e: any) {
        let functionTMP: number = e.target.value;
        setFunction(functionTMP);
        paramsByFunction(functionTMP);
    }

    function handleChangeVariantDependency(e: any) {
        let variantTMP: string = e.target.value;
        setVarAct([variantTMP, ""]);
        activitiesByVariant(variantTMP)
    }

    function handleChangeActivityDependency(e: any) {
        let activityTMP: string = e.target.value;
        setVarAct([varAct[0], activityTMP]);
    }

    function handleChangeGUI(e: any) {
        let guiTMP: number = e.target.value;
        setGUI(guiTMP);
    }

    function addElementToTable() {
        let argumentTMP = argumentsCoor;
        let countTMP = count;
        let screenTMP = screenshots;
        if (guiID !== 0) {
            let guiName: GUIComponentDTO = getByID(guiComponents, guiID);
            if (functionID !== 0) {
                let functionName: VariabilityFunctionDTO = getByID(variabilityFunctions, functionID);
                let paramsTMP: FunctionParamDTO[] = params;
                if (guiName !== null && functionName !== null) {
                    argumentTMP.id = countTMP;
                    if (paramsTMP.length > 0 && functionName.params.length > 0) {
                        for (let j in paramsTMP) {
                            if ((document.getElementById(paramsTMP[j].id.toString()) as HTMLInputElement).value !== null) {
                                argumentTMP.args[paramsTMP[j].label] = (document.getElementById(paramsTMP[j].id.toString()) as HTMLInputElement).value;
                            }
                        }
                    }
                    argumentTMP.name = functionName.id_code;
                    if (guiName !== null) {
                        let colorTMP = randomColor;
                        if (screenTMP.hasOwnProperty(guiName.id_code)) {
                            let listARGS = screenTMP[guiName.id_code!]
                            listARGS.push(argumentTMP)
                            screenTMP[guiName.id_code] = listARGS
                            let listColor = colorTMP[guiName.id_code!]
                            listColor.push("#" + Math.floor(Math.random() * 16777215).toString(16))
                            colorTMP[guiName.id_code] = listColor
                        } else {
                            screenTMP[guiName.id_code] = [argumentTMP]
                            colorTMP[guiName.id_code] = ["#" + Math.floor(Math.random() * 16777215).toString(16)]
                        }
                        setScreenshot({
                            ...screenTMP
                        })
                        setRandomColor({ ...colorTMP })
                    }
                    setErrorMessage(false)
                } else {
                    setErrorMessage(true)
                }
            } else {
                let dependencyTMP: IDependency = initialDependency;
                if (guiName !== null && +varAct[0].trim() !== 0 && varAct[1].trim() !== "") {
                    argumentTMP.id = countTMP;
                    argumentTMP.name = ""
                    dependencyTMP.id = count
                    dependencyTMP.Activity = varAct[1].trim()
                    dependencyTMP.V = +varAct[0].trim()
                    argumentTMP.args_dependency = dependencyTMP;
                    if (guiName !== null) {
                        let colorTMP = randomColor;

                        if (screenTMP.hasOwnProperty(guiName.id_code)) {
                            let listARGS = screenTMP[guiName.id_code!]
                            listARGS.push(argumentTMP)
                            screenTMP[guiName.id_code] = listARGS
                            let listColor = colorTMP[guiName.id_code!]
                            listColor.push("#" + Math.floor(Math.random() * 16777215).toString(16))
                            colorTMP[guiName.id_code] = listColor
                        } else {
                            screenTMP[guiName.id_code] = [argumentTMP]
                            colorTMP[guiName.id_code] = ["#" + Math.floor(Math.random() * 16777215).toString(16)]

                        }
                        setScreenshot({
                            ...screenTMP
                        })
                    }
                    countTMP = countTMP + 1
                    setCount(countTMP);
                    setErrorMessage(false)
                } else {
                    setErrorMessage(true)
                }
            }
        } else {
            setErrorMessage(true)
        }
        argumentTMP = initialArgs
        setArgumentsCoor({ ...argumentTMP });
    }

    function confirmBack() {
        if (window.confirm(t('features.experiment.assist.back'))) {
            history.push('/column-variability/' + variant + '/' + act)
        }
    }

    return (
        <> <Grid
            container
            direction="row"
            spacing={4}>
            <Grid xs={10} lg={10} item style={{ marginTop: theme.spacing(2) }}>
                <Typography variant="h4">
                    <IconButton color="primary" aria-label="go back" component="span" onClick={confirmBack}>
                        <ChevronLeft />
                    </IconButton>
                    {t('features.experiment.assist.title.elementselector')}
                </Typography>
            </Grid>
            <Grid xs={2} lg={2} item style={{ marginTop: theme.spacing(2) }}>
                <Button type="submit" name="save" variant="contained" color="primary" endIcon={<SaveIcon />} onClick={saveAndEnd} style={{ fontSize: "small", marginLeft: 4 }}>
                    {t('features.experiment.assist.next')}
                </Button>
            </Grid>
            {errorMessage &&
                <Grid xs={12} lg={12} item style={{ marginTop: theme.spacing(2) }}>
                    <Typography variant="h5" color="red" >
                        {t('features.experiment.assist.empty')}
                    </Typography>
                </Grid>
            }
        </Grid>
            <Grid
                container
                direction="row"
                spacing={4}>
                <Grid xs={12} lg={12} item style={{ marginTop: theme.spacing(2) }}>
                    <Card>
                        <Box component={"div"}
                            sx={
                                {
                                    position: "relative"
                                }}>
                            {Object.keys(screenshots).length > 0 && Object.keys(screenshots).map((key, index) => (
                                Object.keys(screenshots[key]).map((key2, index2) => (
                                    < Box component={"div"}
                                        sx={{
                                            position: "absolute",
                                            left: resizeRect(screenshots[key][index2].coordinates[0], resolutionBRW[0], resolutionIMG[0]),
                                            top: resizeRect(screenshots[key][index2].coordinates[1], resolutionBRW[1], resolutionIMG[1]),
                                            width: resizeRect(screenshots[key][index2].coordinates[2], resolutionBRW[0], resolutionIMG[0]) - resizeRect(screenshots[key][index2].coordinates[0], resolutionBRW[0], resolutionIMG[0]),
                                            height: resizeRect(screenshots[key][index2].coordinates[3], resolutionBRW[1], resolutionIMG[1]) - resizeRect(screenshots[key][index2].coordinates[1], resolutionBRW[1], resolutionIMG[1]),
                                            outline: "2px solid black",
                                            backgroundColor: randomColor[key][index2],
                                            opacity: 0.3
                                        }}
                                    ></Box>))))
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
                                onLoad={onLoadImage}
                                onMouseDown={handleMouseEnter}
                                onMouseUp={handleMouseLeave}
                                draggable={false}
                            />
                        </Box>
                    </Card>
                </Grid>
                <Grid xs={12} lg={4} item style={{ marginTop: theme.spacing(2) }} >
                    <Card>
                        <CardContent>
                            <Box component={"div"}>
                                <Typography component="div" >
                                    {t('features.experiment.assist.function.gui_components')}:
                                </Typography>
                                <Select
                                    id="select_gui"
                                    value={guiID}
                                    label={t('features.experiment.assist.function.gui_components')}
                                    onChange={handleChangeGUI}
                                >
                                    {Object.keys(guiComponents).map((key, index) => (
                                        <MenuItem value={guiComponents[index].id}>{guiComponents[index].name}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                            <Box component={"div"}>
                                <Typography component="div" >
                                    {t('features.experiment.assist.coordinates.topleft')}:{argumentsCoor.coordinates[0]}, {argumentsCoor.coordinates[1]}
                                </Typography>
                                <Typography component="div">
                                    {t('features.experiment.assist.coordinates.rightbot')}:{argumentsCoor.coordinates[2]}, {argumentsCoor.coordinates[3]}
                                </Typography>
                            </Box>
                            <Grid item justifyContent="center" style={{ marginTop: theme.spacing(2) }}>
                                <Button
                                    onClick={addElementToTable}
                                    variant="contained"
                                    color="secondary"
                                    style={{ fontSize: "small", marginLeft: 4 }}
                                >
                                    {t('features.experiment.assist.add')}</Button>
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
                                id="select_function"
                                value={functionID}
                                label={t('features.experiment.assist.function.variability_function')}
                                onChange={handleChangeFunction}
                            >
                                <MenuItem value={0}>{t('features.experiment.assist.function.dependency')}</MenuItem>
                                {Object.keys(variabilityFunctions).map((key, index) => (
                                    <MenuItem value={variabilityFunctions[index].id}>{variabilityFunctions[index].function_name}</MenuItem>
                                ))}
                            </Select>
                            {functionID === 0 &&
                                <Box component={"div"} style={{ marginTop: theme.spacing(2) }} >
                                    <Box component={"div"} style={{ marginTop: theme.spacing(2) }}>
                                        <Typography component="div">{t('features.experiment.assist.function.activity_dependency')}:</Typography>
                                        <Select
                                            id="select_variant"
                                            value={varAct[0]}
                                            label={t('features.experiment.assist.function.variability_function')}
                                            onChange={handleChangeVariantDependency}
                                        >
                                            {Object.keys(variantDependency).map((key, index) => (
                                                <MenuItem value={variantDependency[index]}>{variantDependency[index]}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                    <Box component={"div"} style={{ marginTop: theme.spacing(2) }}>
                                        <Typography component="div">{t('features.experiment.assist.function.variant_dependency')}:</Typography>
                                        <Select
                                            disabled={+varAct[0].trim() === 0}
                                            id="select_activity"
                                            value={varAct[1]}
                                            label={t('features.experiment.assist.function.variability_function')}
                                            onChange={handleChangeActivityDependency}
                                        >
                                            {Object.keys(activityDependency).map((key, index) => (
                                                <MenuItem value={activityDependency[index]}>{activityDependency[index]}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Box>}
                            {Object.keys(variabilityFunctions).map((key, index) => (
                                variabilityFunctions[index].id === functionID && variabilityFunctions[index].params.length > 0 &&
                                <Box component={"div"} style={{ marginTop: theme.spacing(2) }} >
                                    <Typography component="div" >
                                        {t('features.experiment.assist.function.params_function')}
                                    </Typography>
                                    {Object.keys(params).map((key2, index2) => (
                                        <Box component={"div"}>
                                            <Typography component="div">{params[index2].description}:</Typography>
                                            <TextField id={params[index2].id + ""} required={params[index2].validation_needs === "required"} placeholder={params[index2].placeholder} label={params[index2].label} type={params[index2].data_type} />
                                        </Box>
                                    ))}
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
                {Object.keys(screenshots).length > 0 &&
                    <Grid xs={12} sm={12} item style={{ marginTop: theme.spacing(2), marginBottom: theme.spacing(2) }}>
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
                                    {Object.keys(screenshots).length > 0 && Object.keys(screenshots).map((key, index) => (
                                        Object.keys(screenshots[key]).map((key2, index2) => (
                                            <TableBody>
                                                <TableRow
                                                    key={index}
                                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                >
                                                    <TableCell align="center" component="th" scope="row">
                                                        {key}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        backgroundColor: randomColor[key][index2],
                                                        opacity: 0.3
                                                    }}></TableCell>
                                                    <TableCell align="center" >{screenshots[key][index2].coordinates[0]}, {screenshots[key][index2].coordinates[1]}</TableCell>
                                                    <TableCell align="center" >{screenshots[key][index2].coordinates[2]}, {screenshots[key][index2].coordinates[3]}</TableCell>
                                                    <TableCell align="center" >
                                                        <Button variant="contained" color="secondary" onClick={() => removeElement(key, index2)}>
                                                            {t('features.experiment.assist.delete')}
                                                        </Button></TableCell>
                                                </TableRow>
                                            </TableBody>))))}
                                </Table>
                            </TableContainer>
                        </Card>
                    </Grid>
                }
            </Grid >
        </>
    )
}
export default ExperimentGetGUIComponentsCoordenates;
