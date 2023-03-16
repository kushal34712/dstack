import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Header, FormUI, SpaceBetween, Button, FormInput, FormField, FormTiles } from 'components';
import { useForm, FormProvider, DefaultValues } from 'react-hook-form';
import { IProps, TBackendOption } from './types';
import { AWSBackend } from './AWS';
import { isRequestFormErrors, isRequestFormFieldError } from 'libs/isErrorWithMessage';
import { FormFieldError } from 'libs/types';
import { FieldPath } from 'react-hook-form/dist/types/path';
import styles from './styles.module.scss';

export const ProjectForm: React.FC<IProps> = ({ initialValues, onCancel, loading, onSubmit: onSubmitProp }) => {
    const { t } = useTranslation();
    const isEditing = !!initialValues;

    const getDefaultValues = (): DefaultValues<IProject> => {
        if (initialValues) {
            return {
                ...initialValues,
                backend: {
                    ...initialValues.backend,
                    ...(initialValues.backend.ec2_subnet_id === null ? { ec2_subnet_id: '' } : {}),
                },
            };
        }

        return {
            backend: {
                type: 'aws',
                ec2_subnet_id: '',
            },
        };
    };

    const formMethods = useForm<IProject>({
        defaultValues: getDefaultValues(),
    });

    const { handleSubmit, control, watch, setError, clearErrors } = formMethods;

    const backendType = watch('backend.type');

    const backendOptions: TBackendOption[] = [
        {
            label: t('projects.backend_type.aws'),
            value: 'aws',
            description: t('projects.backend_type.aws_description'),
            disabled: loading,
        },
        // {
        //     label: t('projects.backend_type.gcp'),
        //     value: 'gcp',
        //     description: t('projects.backend_type.gcp_description'),
        //     disabled: true,
        // },
        // {
        //     label: t('projects.backend_type.azure'),
        //     value: 'azure',
        //     description: t('projects.backend_type.azure_description'),
        //     disabled: true,
        // },
    ];

    const onSubmit = (data: IProject) => {
        if (data.backend.ec2_subnet_id === '') data.backend.ec2_subnet_id = null;

        clearErrors();

        onSubmitProp(data).catch((error) => {
            if (!isRequestFormErrors(error.data)) return;

            error.data.detail.forEach((item: FormFieldError) => {
                if (isRequestFormFieldError(item)) {
                    const [_, ...fieldName] = item.loc;
                    setError(fieldName.join('.') as FieldPath<IProject>, { type: 'custom', message: item.msg });
                }
            });
        });
    };

    const renderBackendFields = () => {
        switch (backendType) {
            case 'aws': {
                return <AWSBackend loading={loading} />;
            }
            default:
                return null;
        }
    };

    return (
        <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormUI
                    actions={
                        <SpaceBetween direction="horizontal" size="xs">
                            <Button formAction="none" disabled={loading} variant="link" onClick={onCancel}>
                                {t('common.cancel')}
                            </Button>

                            <Button loading={loading} disabled={loading} variant="primary">
                                {t('common.save')}
                            </Button>
                        </SpaceBetween>
                    }
                >
                    <SpaceBetween size="l">
                        {!isEditing && (
                            <Container header={<Header variant="h2">{t('projects.edit.general')}</Header>}>
                                <SpaceBetween size="l">
                                    <FormInput
                                        label={t('projects.edit.project_name')}
                                        control={control}
                                        name="project_name"
                                        disabled={loading}
                                        rules={{
                                            required: t('validation.required'),

                                            pattern: {
                                                value: /^[a-zA-Z0-9-_]+$/,
                                                message: t('projects.edit.validation.user_name_format'),
                                            },
                                        }}
                                    />
                                </SpaceBetween>
                            </Container>
                        )}

                        <Container header={<Header variant="h2">{t('projects.edit.backend')}</Header>}>
                            <FormField label={t('projects.edit.backend_type')} />

                            <SpaceBetween size="l">
                                <div className={styles.backendTypeTiles}>
                                    <FormTiles control={control} name="backend.type" items={backendOptions} />
                                </div>
                                {renderBackendFields()}
                            </SpaceBetween>
                        </Container>
                    </SpaceBetween>
                </FormUI>
            </form>
        </FormProvider>
    );
};