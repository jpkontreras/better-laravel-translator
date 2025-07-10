import {trans, trans_choice, setLocale} from "./index";
import {App, Ref} from "vue";

export const LaravelTranslatorVue = {
    install: (app: App, options?: ConfigVue) => {
        // Set initial locale if provided
        if (options?.locale) {
            const localeValue = typeof options.locale === 'string' ? options.locale : options.locale.value
            setLocale(localeValue)
        }

        const translationCallback = (key: string, replace?: object) => trans(key, replace || {});

        const translationWithPluralizationCallback = (key: string, number: number, replace?: object) => trans_choice(key, number, replace || {});

        if (parseInt(app.version) > 2) {
            app.provide('__', translationCallback);
            app.provide('t', translationCallback);
            app.provide('trans', translationCallback);
            app.provide('trans_choice', translationWithPluralizationCallback);
            app.provide('transChoice', translationWithPluralizationCallback);

            app.config.globalProperties.__ = translationCallback;
            app.config.globalProperties.t = translationCallback;
            app.config.globalProperties.trans = translationCallback;
            app.config.globalProperties.trans_choice = translationWithPluralizationCallback;
            app.config.globalProperties.transChoice = translationWithPluralizationCallback;
        } else {
            app.mixin({
                methods: {
                    __: translationCallback,
                    t: translationCallback,
                    trans: translationCallback,
                    trans_choice: translationWithPluralizationCallback,
                    transChoice: translationWithPluralizationCallback,
                },
            });
        }

        return app;
    }
};

declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties {
        trans: (key: string, replace?: object) => string;
        transChoice: (key: string, number: number, replace?: object) => string;
        __: (key: string, replace?: object) => string;
        t: (key: string, replace?: object) => string;
        trans_choice: (key: string, number: number, replace?: object) => string;
    }
}

interface ConfigVue {
    locale: string | Ref<string>;
    fallbackLocale?: string | Ref<string>;
}
