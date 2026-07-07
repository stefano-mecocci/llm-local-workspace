import { Directive, HostListener, ElementRef, OnInit } from '@angular/core';

@Directive({
    selector: 'textarea[appAutoResize]',
    standalone: true
})
export class AutoResizeDirective implements OnInit {
    constructor(private el: ElementRef<HTMLTextAreaElement>) { }

    ngOnInit(): void {
        this.adjust();
    }

    @HostListener('input')
    onInput(): void {
        this.adjust();
    }

    private adjust(): void {
        const textarea = this.el.nativeElement;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
}