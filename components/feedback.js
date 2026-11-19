import { useTranslation } from 'next-i18next';
import Input from './input';
import Select from './select';
import { CANCELLATION_FEEDBACKS } from '../lib/constants';

export const isFeedbackMissing = ({ feedback, comment }) => !feedback || (feedback === 'other' && !comment.trim());

export default ({ value, onChange }) => {
    const { t } = useTranslation();

    return (
        <>
            <Select
                id="feedback"
                className="mt-4"
                label={t('apps.delete.modal.feedback.label')}
                value={value.feedback}
                onChange={(e) => onChange({ feedback: e.target.value, comment: '' })}
                data-test="uninstall-feedback"
            >
                <option value="">{t('apps.delete.modal.feedback.placeholder')}</option>
                {CANCELLATION_FEEDBACKS.map((feedback) => (
                    <option key={feedback} value={feedback}>{t(`apps.delete.modal.feedback.${feedback}`)}</option>
                ))}
            </Select>
            {value.feedback === 'other' && (
                <Input
                    id="comment"
                    className="mt-4"
                    label={t('apps.delete.modal.feedback.comment')}
                    value={value.comment}
                    onChange={(e) => onChange({ ...value, comment: e.target.value })}
                    data-test="uninstall-comment"
                />
            )}
        </>
    );
};
