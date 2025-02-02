import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '@mui/styled-engine';
import { Button, Grid, TextField, Theme } from '@mui/material';
import { ErrorOption, useForm } from 'react-hook-form';
import FormInput from 'components/FormInput';
import TextInputContainer from 'components/TextInputContainer';
import Spacer from 'components/Spacer';
import Validations from 'infrastructure/util/validations';
import { objectToFormData } from 'infrastructure/util/form';

export interface ChangePasswordFormProps {
  onSubmit: Function
  disabled: boolean
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSubmit, disabled = false }) => {
  const { t } = useTranslation();
  const theme = useContext(ThemeContext) as Theme;
  const { register, formState, handleSubmit, getValues, setError } = useForm();

  const validateForm = (data: any) => {
    let valid = true;
    const setFormError = (field: string, error: ErrorOption) => {
      valid = false;
      setError(field, error);
    }

    if (Validations.isBlank(data.currentPassword)) setFormError('currentPassword', { type: 'required', message: t('features.user.changePassword.form.errors.currentPasswordRequired') as string });
    if (Validations.isBlank(data.password)) setFormError('password', { type: 'required', message: t('features.user.changePassword.form.errors.passwordRequired') as string });
    else if (data.password.length < 9) setFormError('password', { type: 'required', message: t('features.user.changePassword.form.errors.passwordLengthRequired') as string });
    if (Validations.isBlank(data.repeatedPassword)) setFormError('repeatedPassword', { type: 'required', message: t('features.user.changePassword.form.errors.repeatedPasswordRequired') as string });
    else if (data.password !== data.repeatedPassword) setFormError('repeatedPassword', { type: 'required', message: t('features.user.changePassword.form.errors.passwordsDontMatch') as string });
    
    return valid;
  }

  const formSubmit = (data: any) => {
    if (!validateForm(data)) {
      return false;
    }
    
    onSubmit(objectToFormData(data, {}));
  }

  return (
    <form noValidate autoComplete="off" onSubmit={ handleSubmit(formSubmit) }>
      <FormInput
        title="features.user.changePassword.form.currentPassword.label"
        style={{ marginTop: theme.spacing(3), marginLeft: theme.spacing(2) }}
        labelGridValue={ 3 }
        valueGridValue={ 9 }
      >
        <TextInputContainer>
          <TextField
            fullWidth
            placeholder={t('features.user.changePassword.form.currentPassword.placeholder')}
            inputProps={
              register('currentPassword')
            }
            type="password"
            error={formState.errors.currentPassword != null}
            helperText={formState.errors.currentPassword?.message}
            disabled={ disabled }
          />
        </TextInputContainer>
      </FormInput>

      <FormInput
        title="features.user.changePassword.form.password.label"
        style={{ marginTop: theme.spacing(2), marginLeft: theme.spacing(2) }}
        labelGridValue={ 3 }
        valueGridValue={ 9 }
      >
        <TextInputContainer>
          <TextField
            fullWidth
            placeholder={t('features.user.changePassword.form.password.placeholder')}
            inputProps={
              register('password')
            }
            type="password"
            error={formState.errors.password != null}
            helperText={formState.errors.password?.message}
            disabled={ disabled }
          />
        </TextInputContainer>
      </FormInput>

      <FormInput
        title="features.user.changePassword.form.repeatedPassword.label"
        style={{ marginTop: theme.spacing(2), marginLeft: theme.spacing(2) }}
        labelGridValue={ 3 }
        valueGridValue={ 9 }
      >
        <TextInputContainer>
          <TextField
            fullWidth
            inputProps={
              register('repeatedPassword', {
                required: getValues('password') != null && t('features.user.changePassword.form.errors.repeatedPasswordRequired') as string,
              })
            }
            type="password"
            error={formState.errors.repeatedPassword != null}
            helperText={formState.errors.repeatedPassword?.message}
            disabled={ disabled }
          />
        </TextInputContainer>
      </FormInput>

      <Grid container style={{ marginTop: theme.spacing(4) }}>
        <Spacer />
        <Grid item>
          <Button type="submit" name="save" variant="contained" color="primary" disabled={ disabled }>
            {t('features.user.changePassword.form.save')}
          </Button>
          </Grid>
      </Grid>
    </form>
  )
}

export default ChangePasswordForm;
