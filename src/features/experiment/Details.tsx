import React, { useContext, useEffect, useState } from 'react';
import { Card, CardContent, CardActions, Button, Grid, Theme, Typography, CircularProgress, LinearProgress, Chip, Box, styled, Fab, Switch, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LinkIcon from '@mui/icons-material/Link';
import configuration from "infrastructure/util/configuration";
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { ThemeContext } from '@emotion/react';
import { authSelector } from 'features/auth/slice';

import BackButton from 'components/BackButton';
import { experimentsSelector, saveExperiment, experimentRepository, setExperimentDetail } from './slice';
import { experimentDTOToExperimentType, downloadFile, copyTextToClipboard, experimentToFormData } from './utils';
import ExperimentFormComponent from './Form';
import { Experiment, ExperimentState } from './types';
import NotificationFactory from 'features/notifications/notification';
import { showNotification } from 'features/notifications/slice';

const downloadResults = async (experimentId: number, token: string) => {
  try {
    const { filename, blob }: any = await experimentRepository.download(experimentId, token);
    downloadFile(filename, blob);
  } catch (ex) {
    console.error('error downloading experiment result', ex);
  }
}

const downloadJson = (filename: string, json: any) => {
  const strJson = JSON.stringify(json, null, 2)
  downloadFile(filename, new Blob([strJson], { type: "application/json" }));
}

const buildPublicLink = (id: any): string => `${configuration.PUBLIC_LINK_PART}/experiment/${id}`;

const BoldKey = styled(Typography)`
  font-weight: bold;
`

const FileBox = styled(Box)`
  border: 1px dashed grey;
`

const ChipProperty = styled(Chip)(({ theme }) => ({
  marginRight: theme.spacing(2),
  marginTop: theme.spacing(2),
  fontWeight: 500
}))

const ExperimentDetails: React.FC = () => {
  const { t } = useTranslation();
  const theme = useContext(ThemeContext) as Theme;
  const { experiments, detail } = useSelector(experimentsSelector);
  const auth = useSelector(authSelector);
  const { id } = useParams<{ id: string }>();
  const [experiment, setExperimentInList]: any = useState(null);
  const [loading, setLoading]: any = useState(false);
  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    (async () => {
      try {
        const idParam = parseInt(id, 10);
        setLoading(true)
        setExperimentInList(null);
        let experimentDetail = null;
        if (detail != null && detail.id === idParam) {
          experimentDetail = detail;
        } else if (experiments.length > 0) {
          experimentDetail = experiments.find((exp) => exp.id === idParam);
        }
        if (experimentDetail == null) {
          const response = await experimentRepository.get(idParam, auth.token ?? '');
          experimentDetail = experimentDTOToExperimentType(response.experiment, auth.currentUser);
          dispatch(setExperimentDetail(experimentDetail))
        }
        setExperimentInList(experimentDetail);
      } catch (ex) {
        console.error('error getting experiment detail', ex);
      } finally {
        setLoading(false)
      }
    })();
  }, [id, auth.token]);

  const backPath = (experiment == null || !experiment.owned ? 'public' : '');

  return (
    <>
      <Typography variant="h4">
        <BackButton to={`${configuration.PREFIX}/${backPath}`} />
        {t('features.experiment.details.title')}
      </Typography>

      {
        loading && (
          <Grid container>
            <Grid item>
              <CircularProgress color="secondary" />
            </Grid>
          </Grid>
        )
      }

      {experiment != null && experiment.state === ExperimentState.NOT_LAUNCHED && (
        <ExperimentFormComponent
          initialValues={experiment}
          onSubmit={(data: any) => {
            const variability_mode = data.get('variability_mode');
            data.set('id', id);
            setLoading(true);
            dispatch(saveExperiment(data, (status: string, error: any) => {
              setLoading(false);
              if (error == null) {
                if (status != "LAUNCHED") {
                  if (variability_mode === "scenarioVariability") {
                    history.push(configuration.PREFIX + '/scenario-variability');
                  } else if (variability_mode === "caseVariability") {
                    history.push(configuration.PREFIX + '/case-variability');
                  }
                } else {
                  history.push(configuration.PREFIX + '/');
                }
              } else {
                alert('unexpected error occurred');
                console.error(error);
              }
              }));
          }}
          disabled={ loading }
        />
      )}

      {experiment != null && experiment.state !== ExperimentState.NOT_LAUNCHED && (
        <Card style={{ marginTop: theme.spacing(4) }}>
          <CardContent>
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid item>
                <Typography variant="h6">{experiment.name}</Typography>
              </Grid>
              { experiment.owned &&
                <Grid item>
                  <label>{t('features.experiment.details.published')}</label>
                  <Switch
                    color="secondary"
                    checked={experiment.isPublic}
                    onChange={() => {
                      const experimentData: any = experimentToFormData(experiment);
                      const newValue = !experiment.isPublic;
                      experimentData.set('public', newValue);
                      dispatch(saveExperiment(experimentData, () => {
                        const notification = NotificationFactory.success(
                            t('features.experiment.details.experiment') + ` ${experiment.name} ` + t('features.experiment.details.success') + ` ${newValue ? t('features.experiment.details.publish') : t('features.experiment.details.unpublish')}`
                          )
                          .dismissible()
                          .build();

                        setTimeout(() => {
                          dispatch(showNotification(notification));
                          setExperimentInList({
                            ...experiment,
                            isPublic: newValue
                          })
                        }, 0)
                      }))
                    }}
                    inputProps={{ 'aria-label': t('features.experiment.details.publish') }}
                  />
                </Grid>
              }
            </Grid>
            <Box>
              {experiment.creationDate != null && (
                <Typography variant="caption" sx={{ display: 'inline' }}>
                  {t('features.experiment.details.createdAt', { val: experiment.creationDate })}
                  {experiment.lastEditionDate != null ? ',' : ''}
                </Typography>
              )}
              {experiment.lastEditionDate != null && (
                <Typography variant="caption" sx={{ display: 'inline', ml: 1 }}>
                  {t('features.experiment.details.modifiedAt', { val: experiment.lastEditionDate })}
                </Typography>
              )}
            </Box>

            <ChipProperty
              color="primary"
              label={t('features.experiment.details.scenariosNumber', { val: experiment.numberScenarios }) as string}
            />

            <ChipProperty
              color="primary"
              label={t('features.experiment.details.state', { val: ExperimentState[experiment.state] }) as string}
            />

            <ChipProperty
              color="primary"
              label={t('features.experiment.details.screenshotNameGenerationFunction', { val: experiment.screenshotNameGenerationFunction }) as string}
            />

            <Grid container spacing={3}>
              <Grid item style={{ marginTop: theme.spacing(3) }}>
                <BoldKey variant="body1">{t('features.experiment.details.executionStart')}</BoldKey>{t('commons:datetime', { val: experiment.executionStart })}
              </Grid>
              <Grid item style={{ marginTop: theme.spacing(3) }}>
                <BoldKey variant="body1">{t('features.experiment.details.executionEnd')}</BoldKey>{t('commons:datetime', { val: experiment.executionEnd })}
              </Grid>
            </Grid>

            <Typography variant="subtitle2" style={{ marginTop: theme.spacing(2) }}>{t('features.experiment.details.description')}</Typography>
            {experiment.description != null &&
              (<Typography variant="body1"
                style={{
                  marginTop: theme.spacing(1),
                  padding: theme.spacing(2),
                  backgroundColor: theme.palette.grey['200']
                }}>
                {experiment.description ?? t('features.experiment.details.noDescription')}
              </Typography>)
            }

            {experiment.isPublic && (
              <Grid container spacing={3} style={{ marginTop: theme.spacing(2) }} alignItems="center">
                <Grid item>
                  <BoldKey variant="body1">{t('features.experiment.details.author')}</BoldKey>
                  {experiment.author}
                </Grid>
                <Grid item>
                  <Tooltip title={t('features.experiment.details.copyLink') as string}>
                    <Button
                      color="secondary"
                      startIcon={<LinkIcon />}
                      onClick={() => copyTextToClipboard(buildPublicLink(experiment.id))}
                      style={{
                        ...theme.typography.subtitle1,
                        padding: theme.spacing(1),
                        textTransform: 'initial',
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.grey['100'],
                      }}
                    >
                      {buildPublicLink(experiment.id)}
                    </Button>
                  </Tooltip>
                </Grid>
              </Grid>
            )}

            <Grid container spacing={3} style={{ marginTop: theme.spacing(1) }}>
              {(experiment.numberScenarios ?? 0) > 0 &&
                (<Grid item style={{ marginTop: theme.spacing(1) }}>
                  <FileBox component="span" sx={{ p: 2 }}>
                    <Button
                      startIcon={<AttachFileIcon />}
                      onClick={() => downloadJson('scenarios_conf.json', experiment.scenariosConf)}
                    >{t('features.experiment.details.scenarios')}</Button>
                  </FileBox>
                </Grid>)
              }
              <Grid item style={{ marginTop: theme.spacing(1) }}>
                <FileBox component="span" sx={{ p: 2 }}>
                  <Button
                    startIcon={<AttachFileIcon />}
                    onClick={() => downloadJson('variability_conf.json', experiment.variabilityConf)}
                  >{t('features.experiment.details.variabilityConf')}</Button>
                </FileBox>
              </Grid>
              { /*<Grid item style={{ marginTop: theme.spacing(1) }}>
                <FileBox component="span" sx={{ p: 2 }}>
                  <Button
                    startIcon={ <AttachFileIcon /> }
                  >{ t('features.experiment.details.screenshots') }</Button>
                </FileBox>              
            </Grid>*/ }
            </Grid>

          </CardContent>

          <CardActions style={{ padding: theme.spacing(2) }}>
            {experiment.state === ExperimentState.CREATING && (
              <>
                <Typography variant="body1">{t('features.experiment.creating')}</Typography>
                <LinearProgress color="secondary" />
              </>
            )}
            {experiment.state === ExperimentState.CREATED && (
              <>
                <Fab
                  variant="extended"
                  color="secondary"
                  onClick={() => downloadResults(experiment.id, auth.token ?? '')}
                >
                  <DownloadIcon sx={{ mr: 1 }} />
                  {t('features.experiment.list.downloadResults')}
                </Fab>
              </>
            )}
          </CardActions>
        </Card>
      )}
    </>
  )
}

export default ExperimentDetails;