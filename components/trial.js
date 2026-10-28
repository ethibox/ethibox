import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { PaymentElement } from '@stripe/react-stripe-js';
import { CheckIcon, CreditCardIcon } from '@heroicons/react/20/solid';
import Modal from './modal';
import Button from './button';
import { DEFAULT_PRICE, DEFAULT_CURRENCY, DEFAULT_TRIAL_DAYS } from '../lib/constants';

const formatPrice = (cents, locale) => new Intl.NumberFormat(locale, { style: 'currency', currency: DEFAULT_CURRENCY }).format(cents / 100);

const formatTrialEnd = (locale) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(Date.now() + DEFAULT_TRIAL_DAYS * 24 * 60 * 60 * 1000);

// eslint-disable-next-line complexity
export default ({ app, paymentMethod, paymentRequired, open, loading, onClose, onConfirm }) => {
    const { t } = useTranslation('common');
    const { locale } = useRouter();

    const defaultBenefits = t('index.trial.benefits', { returnObjects: true });
    const benefits = paymentMethod || paymentRequired ? defaultBenefits : [t('index.trial.noCharge'), ...defaultBenefits];
    const charge = t('index.trial.charge', { price: formatPrice(DEFAULT_PRICE, locale), date: formatTrialEnd(locale) });

    return (
        <Modal open={open} onClose={onClose}>
            <Modal.Header>
                <div className="flex items-center gap-4">
                    <img src={app?.logo} className="size-14 shrink-0" alt={app?.name} />
                    <div>
                        <Modal.Title>{t('index.trial.title', { name: app?.name })}</Modal.Title>
                        <Modal.Description className="!mt-0">{t('index.trial.price', { days: DEFAULT_TRIAL_DAYS, price: formatPrice(DEFAULT_PRICE, locale) })}</Modal.Description>
                    </div>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-gray-700">
                    {benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-2">
                            <CheckIcon className="size-5 text-green-500" />
                            {benefit}
                        </li>
                    ))}
                </ul>

                {paymentMethod && (
                    <div className="mt-6 p-3 flex items-center gap-3 rounded-md border border-gray-200 bg-gray-100 text-sm">
                        <CreditCardIcon className="size-5 text-gray-400" />
                        <div>
                            <p className="font-medium text-gray-900">{paymentMethod.label}</p>
                            <p className="text-gray-500">{charge}</p>
                        </div>
                    </div>
                )}

                {paymentRequired && (
                    <div className="mt-6">
                        <p className="mb-4 text-sm text-gray-700">{t('index.trial.paymentRequired')}</p>
                        <PaymentElement />
                        <p className="mt-2 text-sm text-gray-500">{charge}</p>
                    </div>
                )}

                <div className="mt-6 pt-4 flex justify-between border-t border-gray-200 font-semibold text-gray-900">
                    <span>{t('index.trial.dueToday')}</span>
                    <span>{formatPrice(0, locale)}</span>
                </div>
            </Modal.Header>
            <Modal.Footer>
                <Button onClick={onConfirm} loading={loading} loadingText={t('index.loading')} data-test="start-trial">{t('index.trial.confirm')}</Button>
                <Button onClick={onClose} className="bg-white" secondary>{t('index.trial.cancel')}</Button>
            </Modal.Footer>
        </Modal>
    );
};
